// ============================================================
// CONVERGENCE 2026 — Admin Server
// Serves the built site (dist/) and provides a protected API
// for editing events, entering scores, and viewing registrations.
//
// Usage:
//   npm start            (serves on http://localhost:3001)
//   ADMIN_PASSWORD=xxx npm start
//
// Admin panel: open http://localhost:3001/#/admin
// ============================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  regenerate,
  readRegistrationsDetailed,
  buildEvents,
  loadOnspot,
  loadVerification,
  loadAttendance,
  parseCsvLine,
  normalizeEvent,
  readEventRosters,
} from './build-data.mjs';

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const FILES = path.join(ROOT, 'files');
const ADMIN_DIR = path.join(ROOT, 'data-admin');

const PORT = Number(process.env.PORT || 3001);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'convergence26';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function tokenFor(password) {
  return crypto.createHash('sha256').update(`convergence-admin::${password}`).digest('hex');
}
const VALID_TOKEN = tokenFor(ADMIN_PASSWORD);

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function isAuthorized(req) {
  const header = req.headers.authorization || '';
  return header === `Bearer ${VALID_TOKEN}`;
}

function rebuildFrontend() {
  console.log('↻ rebuilding site...');
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const result = spawnSync(process.execPath, [viteBin, 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) console.error('✗ vite build failed');
  else console.log('✓ site rebuilt');
}

// ------------------------------------------------------------
// API routes
// ------------------------------------------------------------
const routes = {
  'POST /api/login': async (req, res) => {
    const { password } = await readBody(req);
    if (password === ADMIN_PASSWORD) return json(res, 200, { token: VALID_TOKEN });
    return json(res, 401, { error: 'Wrong password' });
  },

  // Public merged data (safe fields only)
  'GET /api/data': async (_req, res) => {
    const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'generated', f), 'utf8'));
    return json(res, 200, {
      events: buildEvents(),
      participants: read('participants.json'),
      leaderboard: read('leaderboard.json'),
    });
  },

  // Full registration details — PRIVATE (contains phones/emails)
  'GET /api/admin/registrations': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const all = readRegistrationsDetailed();
    return json(res, 200, { count: all.length, registrations: all, attendance: loadAttendance() });
  },

  // Event-wise team rosters: lead + members per team — PRIVATE
  'GET /api/admin/rosters': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const rosters = readEventRosters();
    return json(res, 200, {
      events: Object.fromEntries(
        Object.entries(rosters).map(([ev, teams]) => [
          ev,
          { count: teams.length, teams },
        ])
      ),
    });
  },

  // Check-in toggle: { key: "name|college", present: bool }
  'PUT /api/admin/attendance': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const { key, present } = await readBody(req);
    if (!key || typeof present !== 'boolean') return json(res, 400, { error: 'key and present required' });

    const attPath = path.join(ADMIN_DIR, 'attendance.json');
    const att = loadAttendance();
    if (present) att[key] = { present: true, at: new Date().toISOString() };
    else delete att[key];
    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    fs.writeFileSync(attPath, JSON.stringify(att, null, 2));
    return json(res, 200, { ok: true, key, present });
  },

  // Event detail edits
  'PUT /api/admin/events': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const body = await readBody(req);
    const { id, ...fields } = body;
    const sourceEvents = buildEvents();
    const target = sourceEvents.find((e) => e.id === Number(id));
    if (!target) return json(res, 404, { error: `Event ${id} not found` });

    const overridesPath = path.join(ADMIN_DIR, 'events-overrides.json');
    let overrides = {};
    if (fs.existsSync(overridesPath)) {
      try { overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8')); } catch {}
    }
    overrides[id] = { ...(overrides[id] || {}), ...fields };
    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));

    regenerate();
    rebuildFrontend();
    return json(res, 200, { ok: true, message: `Event "${target.name}" updated` });
  },

  // Scores entry: rows of {college, team, event, rank|value}
  // replaceEvent: remove that event's existing rows first (edit mode)
  'POST /api/admin/scores': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const body = await readBody(req);
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const clean = rows.filter((r) => r && String(r.college).trim() && String(r.event).trim() && Number.isFinite(Number(r.value)));
    if (!clean.length) return json(res, 400, { error: 'No valid rows' });

    const scoresPath = path.join(ADMIN_DIR, 'scores.csv');
    let kept = ['College,Team,Event,Rank'];
    if (fs.existsSync(scoresPath)) {
      const lines = fs.readFileSync(scoresPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
      const targetEvent = body.replaceEvent ? normalizeEvent(body.replaceEvent) : null;
      for (const line of lines.slice(1)) {
        const cols = parseCsvLine(line);
        if (targetEvent && normalizeEvent(cols[2]) === targetEvent) continue; // drop old rows of this event
        kept.push(line);
      }
    }

    const esc = (v) => {
      const s = String(v ?? '').trim();
      return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    for (const r of clean) kept.push([esc(r.college), esc(r.team), esc(r.event), Number(r.value)].join(','));
    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    fs.writeFileSync(scoresPath, kept.join('\n') + '\n', 'utf8');

    regenerate();
    rebuildFrontend();
    return json(res, 200, {
      ok: true,
      message: body.replaceEvent
        ? `Results for "${body.replaceEvent}" saved (${clean.length} rows)`
        : `${clean.length} score rows saved`,
    });
  },

  'DELETE /api/admin/scores': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const scoresPath = path.join(ADMIN_DIR, 'scores.csv');
    if (fs.existsSync(scoresPath)) fs.unlinkSync(scoresPath);
    regenerate();
    rebuildFrontend();
    return json(res, 200, { ok: true, message: 'All results cleared' });
  },

  // ---- On-spot registrations ----
  'POST /api/admin/onspot': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const body = await readBody(req);
    if (!String(body.lead || '').trim()) return json(res, 400, { error: 'Participant name is required' });
    const events = Array.isArray(body.events) ? body.events.filter(Boolean) : [];
    if (!events.length) return json(res, 400, { error: 'Select at least one event' });

    const list = loadOnspot();
    const entry = {
      id: Date.now(),
      lead: String(body.lead).trim(),
      phone: String(body.phone || '').trim(),
      email: String(body.email || '').trim(),
      college: String(body.college || '').trim(),
      department: String(body.department || '').trim(),
      events,
      members: (Array.isArray(body.members) ? body.members : [])
        .map((m) => ({ name: String(m.name || '').trim(), phone: String(m.phone || '').trim() }))
        .filter((m) => m.name),
      paid: Boolean(body.paid),
      verified: Boolean(body.paid), // paying on the spot = verified
      createdAt: new Date().toISOString(),
    };
    list.push(entry);
    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    fs.writeFileSync(path.join(ADMIN_DIR, 'onspot-registrations.json'), JSON.stringify(list, null, 2));

    regenerate();
    rebuildFrontend();
    return json(res, 200, { ok: true, message: `On-spot registration for "${entry.lead}" saved`, entry });
  },

  'DELETE /api/admin/onspot': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const { id } = await readBody(req);
    const list = loadOnspot().filter((e) => e.id !== Number(id));
    fs.writeFileSync(path.join(ADMIN_DIR, 'onspot-registrations.json'), JSON.stringify(list, null, 2));
    regenerate();
    rebuildFrontend();
    return json(res, 200, { ok: true, message: 'Entry removed' });
  },

  // ---- Bulk CSV import ----
  // type 'scores'       rows: {college, team, event, value}
  // type 'registrations rows: {name, college, phone, email, event, paid}
  'POST /api/admin/import': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const body = await readBody(req);
    const type = body.type;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) return json(res, 400, { error: 'No rows to import' });

    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    let added = 0;
    let skipped = 0;

    if (type === 'scores') {
      const scoresPath = path.join(ADMIN_DIR, 'scores.csv');
      let lines = ['College,Team,Event,Rank'];
      if (fs.existsSync(scoresPath)) {
        const cur = fs.readFileSync(scoresPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
        lines = [cur[0] || 'College,Team,Event,Rank', ...cur.slice(1)];
      }
      const esc = (v) => {
        const s = String(v ?? '').trim();
        return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      for (const r of rows) {
        if (!String(r.college || '').trim() || !Number.isFinite(Number(r.value))) { skipped++; continue; }
        lines.push([esc(r.college), esc(r.team), esc(r.event || body.defaultEvent || ''), Number(r.value)].join(','));
        added++;
      }
      fs.writeFileSync(scoresPath, lines.join('\n') + '\n', 'utf8');
    } else if (type === 'participants') {
      // Master participant list update: merge (dedupe) or replace
      const masterPath = path.join(FILES, 'Participants - Sheet1.csv');
      const HEADER = 'Sl No,Name of the Participant,Contact number ,Email-id,College';
      const esc = (v) => {
        const s = String(v ?? '').trim();
        return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const keyOf = (name, college) => `${norm(name)}|${norm(college)}`;

      let outLines = [];
      const seen = new Set();

      if (body.mode !== 'replace' && fs.existsSync(masterPath)) {
        const cur = fs.readFileSync(masterPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
        outLines = [HEADER];
        for (const line of cur.slice(1)) {
          const cols = parseCsvLine(line);
          const name = cols[1] || '';
          const college = cols[4] || '';
          outLines.push(line);
          seen.add(keyOf(name, college));
        }
      } else {
        outLines = [HEADER];
      }

      let slNo = outLines.length - 1;
      for (const r of rows) {
        const name = String(r.name || '').trim();
        const college = String(r.college || '').trim();
        if (!name || !college) { skipped++; continue; }
        const k = keyOf(name, college);
        if (seen.has(k)) { skipped++; continue; }
        seen.add(k);
        slNo++;
        outLines.push([String(slNo), esc(name), esc(r.phone || ''), esc(r.email || ''), esc(college)].join(','));
        added++;
      }
      fs.writeFileSync(masterPath, outLines.join('\n') + '\n', 'utf8');
    } else {
      // registrations → onspot entries (deduped)
      const list = loadOnspot();
      const seen = new Set(list.map((e) =>
        `${(e.lead || '').toLowerCase().trim()}|${(e.college || '').toLowerCase().trim()}|${String(e.phone || '').trim()}`
      ));
      let id = Date.now();
      for (const r of rows) {
        const lead = String(r.name || '').trim();
        const college = String(r.college || '').trim();
        const phone = String(r.phone || '').trim();
        if (!lead) { skipped++; continue; }
        const k = `${lead.toLowerCase()}|${college.toLowerCase()}|${phone}`;
        if (seen.has(k)) { skipped++; continue; }
        seen.add(k);
        const paidRaw = String(r.paid ?? '').trim().toLowerCase();
        const paid = ['yes', '1', 'true', 'paid'].includes(paidRaw);
        list.push({
          id: id++,
          lead,
          phone,
          email: String(r.email || '').trim(),
          college,
          department: String(r.department || '').trim(),
          events: r.event ? [r.event] : (body.defaultEvent ? [body.defaultEvent] : []),
          members: String(r.members || '').trim()
            .split(/[,;]/).map((n) => ({ name: n.trim(), phone: '' })).filter((m) => m.name),
          paid,
          verified: paid,
          createdAt: new Date().toISOString(),
          imported: true,
        });
        added++;
      }
      fs.writeFileSync(path.join(ADMIN_DIR, 'onspot-registrations.json'), JSON.stringify(list, null, 2));
    }

    regenerate();
    rebuildFrontend();
    return json(res, 200, { ok: true, message: `Imported ${added} row(s)` + (skipped ? `, skipped ${skipped}` : '') });
  },

  // ---- Verification / payment toggles ----
  'PUT /api/admin/verify': async (req, res) => {
    if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });
    const { key, patch } = await readBody(req);
    if (!key || typeof patch !== 'object') return json(res, 400, { error: 'key and patch required' });

    const verPath = path.join(ADMIN_DIR, 'verification.json');
    const ver = loadVerification();
    ver[key] = { ...(ver[key] || {}), ...patch };
    fs.mkdirSync(ADMIN_DIR, { recursive: true });
    fs.writeFileSync(verPath, JSON.stringify(ver, null, 2));
    return json(res, 200, { ok: true, key, patch: ver[key] });
  },
};

// ------------------------------------------------------------
// Static file serving (dist/) with SPA fallback
// ------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(DIST, decodeURIComponent(pathname));
  if (!filePath.startsWith(DIST)) return json(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

// ------------------------------------------------------------
// Server
// ------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const routeKey = `${req.method} ${url.pathname}`;

  try {
    if (routes[routeKey]) return await routes[routeKey](req, res);
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Unknown endpoint' });
    return serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error('✗', err);
    return json(res, 500, { error: err.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log('============================================================');
  console.log('  CONVERGENCE 2026 — Admin Server');
  console.log(`  Site:        http://localhost:${PORT}/`);
  console.log(`  Admin panel: http://localhost:${PORT}/#/admin`);
  console.log(`  Password:    ${ADMIN_PASSWORD === 'convergence26' ? '(default) convergence26' : '(set via ADMIN_PASSWORD)'}`);
  console.log('============================================================');
});
