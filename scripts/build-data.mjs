// ============================================================
// CONVERGENCE 2026 — Data Pipeline
// Reads raw registration files from /files and generates
// normalized JSON consumed by the site.
//
// Usage:
//   npm run build-data
//
// Inputs (in ../files):
//   - Convergence 2026 Registration Form (Responses).xlsx
//   - Participants - Sheet1.csv
//   - scores.csv            (optional — results; see scores.template.csv)
//
// Outputs (src/data/generated/):
//   - participants.json
//   - leaderboard.json
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import XLSX from 'xlsx';
import { EVENTS as SOURCE_EVENTS } from '../src/data/events.source.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FILES = path.join(ROOT, 'files');
const OUT = path.join(ROOT, 'src', 'data', 'generated');

// Admin-editable stores (tracked in git so GitHub-sync works)
const ADMIN_DIR = path.join(ROOT, 'data-admin');

// One-time migration: old files/ locations -> data-admin/
function migrateAdminFile(name) {
  try {
    const oldP = path.join(FILES, name);
    const newP = path.join(ADMIN_DIR, name);
    if (fs.existsSync(oldP) && !fs.existsSync(newP)) {
      fs.mkdirSync(ADMIN_DIR, { recursive: true });
      fs.copyFileSync(oldP, newP);
      console.log('migrated', name, '-> data-admin/');
    }
  } catch {}
}
[
  'verification.json',
  'attendance.json',
  'scores.csv',
  'events-overrides.json',
  'onspot-registrations.json',
].forEach(migrateAdminFile);

// ------------------------------------------------------------
// College normalization
// NOTE: BYC and Yeshwanthpur are intentionally DIFFERENT entries.
// ------------------------------------------------------------
const CANONICAL = {
  alliance: 'Alliance University',
  jyoti: 'Jyoti Nivas College (Autonomous)',
  kristu: 'Kristu Jayanti (Deemed to be) University',
  claret: 'St. Claret College',
  ramaiah: 'M S Ramaiah College of Arts, Science and Commerce',
  academy: 'Christ Academy Institute for Advanced Studies',
  gfgc: 'GFGC College Hoskote',
};

function normalizeCollege(raw) {
  let c = String(raw ?? '').trim();
  if (!c) return null;
  const low = c.toLowerCase().replace(/[^a-z]+/g, ' ');

  // Garbage rows (phone numbers / person names slipped into the column)
  if (/^\d+$/.test(c.trim())) return null;
  if (/^(sujan shankar|vamsi k)$/.test(low)) return null;

  const isChrist = low.includes('christ') || low.includes('chirst') || low.includes('chri ');
  if (isChrist) {
    if (low.includes('byc')) return 'Christ University (BYC)';
    if (/yes|yesh|ysw|ypr/.test(low)) return 'Christ University (Yeshwanthpur Campus)';
    return 'Christ University'; // no campus marker given
  }

  // Fix common typos before matching canonical names
  const fixed = low.replace('allaince', 'alliance').replace('unversity', 'university');
  if (/j[oy]+th?i\s*nivas/.test(fixed)) return CANONICAL.jyoti;
  for (const [key, name] of Object.entries(CANONICAL)) {
    if (fixed.includes(key)) return name;
  }
  return c.replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------
// Event name normalization (registration strings → site names)
// ------------------------------------------------------------
function normalizeEvent(raw) {
  const e = String(raw ?? '').toLowerCase();
  if (!e.trim()) return null;
  if (e.includes('infinity')) return 'Project Infinity';
  if (e.includes('heist')) return 'Math Heist';
  if (e.includes('overdrive') || e.includes('odds')) return 'Odds & Overdrive';
  if (e.includes('cipher')) return 'Cipher & Coin';
  if (e.includes('bingo')) return 'Numero Bingo';
  if (e.includes('minister')) return 'Math Minister';
  if (e.includes('traitor')) return "Traitor's Algorithm";
  if (e.includes('vortex') || e.includes('vertex')) return 'Vertex';

  // Fuzzy fallback for typos: "Vortext", "Verterx", "Ciper Coin", "Maths Miniter"...
  const letters = e.replace(/[^a-z]/g, '');
  if (letters.length >= 4) {
    let best = null; let bestDist = Infinity;
    for (const c of CANONICAL_EVENTS) {
      const d = levenshtein(letters, c.toLowerCase().replace(/[^a-z]/g, ''));
      if (d < bestDist) { bestDist = d; best = c; }
    }
    const maxDist = letters.length >= 12 ? 3 : 2;
    if (best && bestDist <= maxDist) return best;
  }
  return null;
}

// Canonical event names for fuzzy matching
const CANONICAL_EVENTS = [
  'Project Infinity', 'Math Heist', 'Odds & Overdrive', 'Cipher & Coin',
  'Numero Bingo', 'Math Minister', "Traitor's Algorithm", 'Vertex',
];

// Levenshtein edit distance
function levenshtein(a, b) {
  const m = a.length; const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[n];
}

// ------------------------------------------------------------
// Registration form structure
// Three parallel "slots", each with its own event + member columns
// ------------------------------------------------------------
const SLOTS = [
  {
    eventKey: 'Choose event 1',
    memberCols: ['Name of participant 1', 'Name of participant 2', 'Name of participant 3'],
    phoneCols: ['Whatsapp number of participant 1', 'Whatsapp number of participant 2', 'Whatsapp number of participant 3'],
  },
  {
    eventKey: 'First Slot Events',
    memberCols: ['Name of participant 1 2', 'Name of participant 2 2', 'Name of participant 3 2'],
    phoneCols: ['Whatsapp number of participant 1 2', 'Whatsapp number of participant 2 2', 'Whatsapp number of participant 3 2'],
  },
  {
    eventKey: 'Second Slot Events',
    memberCols: ['Name of participant 1 3', 'Name of participant 2 3', 'Name of participant 3 3'],
    phoneCols: ['Whatsapp number of participant 1 3', 'Whatsapp number of participant 2 3', 'Whatsapp number of participant 3 3'],
  },
];

// Normalizes Indian mobile numbers (strips leading 91 / 0 prefixes)
function normalizePhone(v) {
  if (v == null) return '';
  const raw = Number.isFinite(Number(v)) ? String(Math.trunc(Number(v))) : String(v);
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
// Phone numbers accidentally typed into name fields
const isJunkName = (n) => /^\d{7,}$/.test(String(n ?? '').replace(/\s/g, ''));

// Parse registration workbook
function readRegistrations() {
  const xlsxPath = path.join(FILES, 'Convergence 2026 Registration Form (Responses).xlsx');
  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  // Deduplicate repeated submissions (same email submitted twice)
  const seenEmails = new Set();

  const teams = [];
  for (const r of rows) {
    const college = normalizeCollege(r['Name of the Institution ']);
    const lead = String(r['Full Name'] ?? '').trim();
    const email = String(r['Email Address'] ?? '').trim().toLowerCase();
    if (!college && !lead) continue;
    if (email && seenEmails.has(email)) continue; // duplicate submission — keep first only
    if (email) seenEmails.add(email);

    for (const slot of SLOTS) {
      const eventName = normalizeEvent(r[slot.eventKey]);
      if (!eventName) continue;
      const members = [];
      for (const col of slot.memberCols) {
        const name = String(r[col] ?? '').trim();
        if (name && !isJunkName(name)) members.push(name);
      }
      teams.push({
        college,
        lead,
        event: eventName,
        members: members.length ? [...new Set(members)] : (lead ? [lead] : []),
      });
    }
  }

  // Include on-spot registrations in aggregates
  for (const o of loadOnspot()) {
    const college = normalizeCollege(o.college);
    for (const ev of o.events || []) {
      const eventName = normalizeEvent(ev);
      if (!eventName) continue;
      const members = [o.lead, ...(o.members || []).map((m) => m.name)].filter(Boolean);
      teams.push({
        college,
        lead: o.lead || '',
        event: eventName,
        members: members.length ? [...new Set(members)] : [],
      });
    }
  }
  return teams;
}

// ------------------------------------------------------------
// On-spot registrations + verification overrides (admin managed)
// files/onspot-registrations.json : array of entries
// files/admin-verification.json   : { "<key>": { verified, paid } }
// ------------------------------------------------------------
function loadJsonSafe(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { console.warn(`⚠ ${path.basename(filePath)} is not valid JSON — ignoring`); return fallback; }
}

function regKey(r) {
  return `${(r.lead || '').toLowerCase().trim()}|${(r.email || '').toLowerCase().trim()}|${(r.collegeRaw || r.college || '').toLowerCase().trim()}`;
}

function loadOnspot() {
  const priv = loadJsonSafe(path.join(ADMIN_DIR, 'onspot-registrations.json'), []);
  // Public-safe additions (no phone/email) committed from the Vercel admin
  const pub = loadJsonSafe(path.join(ADMIN_DIR, 'onspot-public.json'), []).map((o) => ({
    ...o,
    email: '',
    department: '',
    phone: '',
    members: (o.members || []).map((m) => ({ name: m.name || '', phone: '' })),
    source: 'public-add',
  }));
  return [...priv, ...pub];
}

// Public-safe onspot store (tracked in git)
export function appendPublicOnspot(entry) {
  const p = path.join(ADMIN_DIR, 'onspot-public.json');
  const list = loadJsonSafe(p, []);
  list.push({ ...entry, createdAt: entry.createdAt || new Date().toISOString() });
  fs.mkdirSync(ADMIN_DIR, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(list, null, 2));
  return list.length;
}

function loadVerification() {
  return loadJsonSafe(path.join(ADMIN_DIR, 'verification.json'), {});
}

// Check-in marks: files/admin-attendance.json
// { "<name>|<college>": { present: true, at: ISO } }
function loadAttendance() {
  return loadJsonSafe(path.join(ADMIN_DIR, 'attendance.json'), {});
}

// Apply admin verification on top of raw form status
function applyVerification(registrations) {
  const ver = loadVerification();
  for (const r of registrations) {
    const v = ver[r.key] || {};
    r.verified = Boolean(v.verified);
    if (v.paid !== undefined) r.paid = v.paid ? '1' : '0';
  }
  return registrations;
}

// ------------------------------------------------------------
// Detailed registrations (admin only — includes contact info)
// Online form rows merged with on-spot entries.
// ------------------------------------------------------------
function readRegistrationsDetailed() {
  const xlsxPath = path.join(FILES, 'Convergence 2026 Registration Form (Responses).xlsx');
  const out = [];

  if (fs.existsSync(xlsxPath)) {
    const wb = XLSX.readFile(xlsxPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const seenEmails = new Set();

    for (const r of rows) {
      const emailRaw = String(r['Email Address'] ?? '').trim();
      const emailKey = emailRaw.toLowerCase();
      if (emailKey && seenEmails.has(emailKey)) continue; // duplicate submission
      if (emailKey) seenEmails.add(emailKey);

      const events = [];
      for (const slot of SLOTS) {
        const eventName = normalizeEvent(r[slot.eventKey]);
        if (eventName) events.push(eventName);
      }
      // Skip junk/accidental submissions: no name AND nothing selected
      if (!String(r['Full Name'] ?? '').trim() && !events.length && !emailKey) continue;
      // Union of members across all slots
      const members = [];
      for (const slot of SLOTS) {
        for (let m = 0; m < slot.memberCols.length; m++) {
          const name = String(r[slot.memberCols[m]] ?? '').trim();
          if (!name || isJunkName(name)) continue;
          if (!members.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
            members.push({ name, phone: normalizePhone(r[slot.phoneCols[m]]) });
          }
        }
      }
      out.push({
        lead: String(r['Full Name'] ?? '').trim(),
        email: emailRaw,
        phone: normalizePhone(r['Whatsapp Number']),
        collegeRaw: String(r['Name of the Institution '] ?? '').trim(),
        college: normalizeCollege(r['Name of the Institution ']),
        department: String(r['Department '] ?? '').trim(),
        events,
        members,
        accommodation: String(r['Do you require Accommodation (For Outstation Participants ) '] ?? '').trim(),
        status: String(r['Status '] ?? '').trim(),
        paid: String(r['paid'] ?? '').trim(),
        heardFrom: String(r[`How Did u get to know about Convergence'26?`] ?? '').trim(),
        source: 'Online Form',
      });
    }
  }

  // On-spot entries
  for (const o of loadOnspot()) {
    out.push({
      id: o.id,
      lead: o.lead || '',
      email: o.email || '',
      phone: o.phone || '',
      collegeRaw: o.college || '',
      college: normalizeCollege(o.college),
      department: o.department || '',
      events: o.events || [],
      members: (o.members || []).map((m) => ({ name: m.name || '', phone: m.phone || '' })),
      accommodation: '',
      status: o.verified ? 'Completed' : 'On-Spot',
      paid: o.paid ? '1' : '0',
      heardFrom: 'On-Spot',
      source: 'On-Spot',
    });
  }

  for (const r of out) r.key = regKey(r);
  return applyVerification(out);
}

// ------------------------------------------------------------
// Parse participants CSV
// ------------------------------------------------------------
function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function readParticipantsCsv() {
  const csvPath = path.join(FILES, 'Participants - Sheet1.csv');
  if (!fs.existsSync(csvPath)) return [];
  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const list = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const name = (cols[1] || '').trim();
    const college = normalizeCollege(cols[4]);
    if (name && college) list.push({ name: name.replace(/\s+/g, ' '), college });
  }
  return list;
}

// ------------------------------------------------------------
// Scores (optional results file)
// Format per line: College,Team,Event,Rank   OR   College,Team,Event,Score
// See scores.template.csv
// ------------------------------------------------------------
const POINTS_BY_RANK = [10, 7, 5, 3]; // rank 5+ gets 1 point

function pointsForRank(rank) {
  return rank >= 1 && rank <= POINTS_BY_RANK.length ? POINTS_BY_RANK[rank - 1] : 1;
}

function rankByScoreDesc(entries) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  let lastValue = null; let lastRank = 0;
  return sorted.map((entry, i) => {
    if (entry.value !== lastValue) { lastRank = i + 1; lastValue = entry.value; }
    return { ...entry, rank: lastRank };
  });
}

function readScores(_collegeExists) {
  const scoresPath = path.join(ADMIN_DIR, 'scores.csv');
  if (!fs.existsSync(scoresPath)) {
    console.log('ℹ No scores.csv found — leaderboard will show registrations-only standings.');
    return null;
  }
  const lines = fs.readFileSync(scoresPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  // 4th column can be either an explicit rank or a raw score
  const mode = (header[3] || 'score').includes('rank') ? 'rank' : 'score';
  const warnings = [];
  const byEvent = {}; // event -> [{college, team, value}]
  for (const line of lines.slice(1)) {
    const [rawCollege, team, rawEvent, rawValue] = parseCsvLine(line);
    const college = normalizeCollege(rawCollege);
    const event = normalizeEvent(rawEvent);
    const value = Number(rawValue);
    if (!college || !event || Number.isNaN(value)) {
      warnings.push(`Skipped malformed row: "${line}"`);
      continue;
    }
    if (!college) warnings.push(`Unrecognized college "${college}" in scores`);
    (byEvent[event] ??= []).push({ college, team: (team || '').trim(), value });
  }
  for (const w of warnings) console.warn('⚠ ' + w);

  const events = {};
  for (const [event, entries] of Object.entries(byEvent)) {
    const ranked = mode === 'rank'
      ? [...entries]
        .sort((a, b) => a.value - b.value)
        .map((e) => ({ ...e, rank: e.value }))
      : rankByScoreDesc(entries);
    events[event] = ranked.map(({ rank, ...rest }) => ({
      rank,
      points: pointsForRank(rank),
      ...rest,
    }));
  }
  return events;
}

// ------------------------------------------------------------
// Events (source of truth + admin overrides)
// files/admin-events.json format: { "<event id>": { field: value } }
// ------------------------------------------------------------
function buildEvents() {
  let overrides = {};
  const overridesPath = path.join(ADMIN_DIR, 'events-overrides.json');
  if (fs.existsSync(overridesPath)) {
    try { overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8')); }
    catch { console.warn('⚠ admin-events.json is not valid JSON — ignoring'); }
  }
  return SOURCE_EVENTS.map((e) => {
    const o = overrides[e.id];
    return o ? { ...e, ...o } : e;
  });
}

// ------------------------------------------------------------
// Aggregate + write outputs
// ------------------------------------------------------------
function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // ------------------------------------------------------------
  // CI/Vercel safety: raw registration files contain personal data
  // and are intentionally NOT in git. When they're absent, keep
  // the already-committed generated JSONs untouched.
  // ------------------------------------------------------------
  const xlsxName = 'Convergence 2026 Registration Form (Responses).xlsx';
  const csvName = 'Participants - Sheet1.csv';
  const hasRaw = fs.existsSync(path.join(FILES, xlsxName)) && fs.existsSync(path.join(FILES, csvName));
  if (!hasRaw) {
    console.log('ℹ Raw registration files not present (private, gitignored) — using committed generated data.');

    // Ensure events.json exists on fresh clones (derived from tracked source)
    const eventsPath = path.join(OUT, 'events.json');
    if (!fs.existsSync(eventsPath)) {
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(eventsPath, JSON.stringify(buildEvents(), null, 2));
      console.log('✓ wrote events.json from tracked source');
    }
    return;
  }

  // ---- events.json ----
  const events = buildEvents();
  fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(events, null, 2));

  const regTeams = readRegistrations();       // one entry per team per event
  const csvParticipants = readParticipantsCsv();

  // Event-wise participants from registration member lists
  const eventParticipants = {};               // event -> Set("name|college")
  const collegeTeams = {};                    // college -> total team registrations
  const collegeEvents = {};                   // college -> Set of events entered
  for (const t of regTeams) {
    if (!t.college) continue;
    collegeTeams[t.college] = (collegeTeams[t.college] || 0) + 1;
    (collegeEvents[t.college] ??= new Set()).add(t.event);
    (eventParticipants[t.event] ??= new Set());
    for (const m of t.members) {
      if (m) eventParticipants[t.event].add(`${m.toLowerCase()}|${t.college}|${m}`);
    }
  }

  const allColleges = [...new Set([
    ...Object.keys(collegeTeams),
    ...csvParticipants.map((p) => p.college),
  ])];
  const collegeParticipants = {};
  for (const p of csvParticipants) {
    collegeParticipants[p.college] = (collegeParticipants[p.college] || 0) + 1;
  }

  // Merge registration-derived participant counts (leads/members not in CSV)
  const regOnlyPeople = {};
  for (const [, people] of Object.entries(eventParticipants)) {
    for (const entry of people) {
      const [, college] = entry.split('|');
      regOnlyPeople[college] = (regOnlyPeople[college] || 0) + 1;
    }
  }

  // ---- participants.json ----
  const eventsOut = {};
  for (const [event, people] of Object.entries(eventParticipants)) {
    eventsOut[event] = [...people].map((entry) => {
      const [nameKey, college, display] = entry.split('|');
      return { name: display, key: nameKey, college };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  const participantsJson = {
    generatedAt: new Date().toISOString(),
    totalRegistered: csvParticipants.length,
    totalTeams: regTeams.length,
    colleges: allColleges.map((name) => ({
      name,
      participants: Math.max(collegeParticipants[name] || 0, regOnlyPeople[name] || 0),
      teams: collegeTeams[name] || 0,
      eventsEntered: collegeEvents[name] ? collegeEvents[name].size : 0,
    })).sort((a, b) => b.participants - a.participants),
    events: eventsOut,
  };
  fs.writeFileSync(path.join(OUT, 'participants.json'), JSON.stringify(participantsJson, null, 2));

  // ---- checkin.json (public-safe: name + college + events, NO contact info) ----
  const personMap = new Map(); // key -> {name, college, events:Set}
  const addPerson = (name, collegeRaw, event) => {
    if (!name || !collegeRaw || isJunkName(name)) return;
    const college = normalizeCollege(collegeRaw) || collegeRaw;
    const key = `${norm(name)}|${norm(college)}`;
    if (!personMap.has(key)) personMap.set(key, { key, name: name.replace(/\s+/g, ' '), college, events: new Set() });
    if (event) personMap.get(key).events.add(event);
  };
  for (const t of regTeams) {
    for (const m of t.members) if (!isJunkName(m)) addPerson(m, t.college, t.event);
  }
  const checkinJson = {
    generatedAt: participantsJson.generatedAt,
    count: personMap.size,
    people: [...personMap.values()]
      .map((p) => ({ ...p, events: [...p.events].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  fs.writeFileSync(path.join(OUT, 'checkin.json'), JSON.stringify(checkinJson, null, 2));

  // ---- leaderboard.json ----
  const scoreEvents = readScores(() => true);
  const collegePoints = {};
  const collegeWins = {};
  if (scoreEvents) {
    for (const [_event, standings] of Object.entries(scoreEvents)) {
      for (const row of standings) {
        collegePoints[row.college] = (collegePoints[row.college] || 0) + row.points;
        if (row.rank === 1) collegeWins[row.college] = (collegeWins[row.college] || 0) + 1;
      }
    }
  }

  const leaderboardJson = {
    generatedAt: participantsJson.generatedAt,
    hasResults: Boolean(scoreEvents),
    pointsSystem: POINTS_BY_RANK,
    colleges: allColleges.map((name) => ({
      name,
      points: collegePoints[name] || 0,
      wins: collegeWins[name] || 0,
      teams: collegeTeams[name] || 0,
      participants: participantsJson.colleges.find((c) => c.name === name)?.participants || 0,
    })).sort((a, b) => b.points - a.points || b.wins - a.wins || b.participants - a.participants),
    events: scoreEvents || {},
  };
  fs.writeFileSync(path.join(OUT, 'leaderboard.json'), JSON.stringify(leaderboardJson, null, 2));

  console.log(`✓ ${regTeams.length} team registrations across ${allColleges.length} colleges`);
  console.log(`✓ ${csvParticipants.length} participants parsed`);
  console.log(`✓ wrote src/data/generated/{events,participants,checkin,leaderboard}.json`);
  if (scoreEvents) {
    for (const [ev, st] of Object.entries(scoreEvents)) console.log(`  • ${ev}: ${st.length} scored entries`);
  }
}

// ------------------------------------------------------------
// Exports (used by scripts/admin-server.mjs)
// ------------------------------------------------------------
// ------------------------------------------------------------
// Event-wise team rosters (admin)
// Preserves which members belong to WHICH event/slot, unlike
// readRegistrationsDetailed() which unions all slots.
// Returns: { "<event>": [{ lead, phone, college, members:[{name,phone}], source }] }
// ------------------------------------------------------------
function readEventRosters() {
  const out = {};
  const xlsxPath = path.join(FILES, 'Convergence 2026 Registration Form (Responses).xlsx');

  if (fs.existsSync(xlsxPath)) {
    const wb = XLSX.readFile(xlsxPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const seenEmails = new Set();

    for (const r of rows) {
      const emailKey = String(r['Email Address'] ?? '').trim().toLowerCase();
      if (emailKey && seenEmails.has(emailKey)) continue;
      if (emailKey) seenEmails.add(emailKey);

      const lead = String(r['Full Name'] ?? '').trim();
      const collegeRaw = String(r['Name of the Institution '] ?? '').trim();

      for (const slot of SLOTS) {
        const ev = normalizeEvent(r[slot.eventKey]);
        if (!ev) continue;
        const leadLower = norm(lead);
        const members = [];
        for (let m = 0; m < slot.memberCols.length; m++) {
          const name = String(r[slot.memberCols[m]] ?? '').trim();
          if (!name || norm(name) === leadLower || isJunkName(name)) continue; // lead listed as own member
          members.push({ name, phone: normalizePhone(r[slot.phoneCols[m]]) });
        }
        (out[ev] ??= []).push({
          lead,
          phone: normalizePhone(r['Whatsapp Number']),
          college: normalizeCollege(collegeRaw) || collegeRaw,
          members,
          source: 'Online Form',
        });
      }
    }
  }

  // On-spot entries
  for (const o of loadOnspot()) {
    const members = (o.members || []).map((m) => ({ name: m.name || '', phone: m.phone || '' }));
    for (const ev of o.events || []) {
      const eventName = normalizeEvent(ev);
      if (!eventName) continue;
      (out[eventName] ??= []).push({
        lead: o.lead || '',
        phone: o.phone || '',
        college: normalizeCollege(o.college) || o.college || '',
        members,
        source: 'On-Spot',
      });
    }
  }

  return out;
}

export {
  normalizeCollege,
  normalizeEvent,
  normalizePhone,
  parseCsvLine,
  readRegistrations,
  readRegistrationsDetailed,
  readParticipantsCsv,
  readScores,
  buildEvents,
  readEventRosters,
  loadOnspot,
  loadVerification,
  loadAttendance,
  regKey,
  SLOTS,
  POINTS_BY_RANK,
};

export function regenerate() {
  main();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
