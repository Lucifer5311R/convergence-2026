// ============================================================
// CONVERGENCE 2026 — Per-event participant list verification
// Cross-checks coordinator-made CSVs in each event folder
// against the master registration XLSX.
// Expected CSV format (headerless):
//   College, Lead Name, Phone, [Member Name, Phone]...
//
// Usage: npm run verify-lists
// ============================================================

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { normalizeCollege, normalizeEvent, SLOTS } from './build-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES = path.join(__dirname, '..', 'files');

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const cleanPhone = (v) => String(v ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');

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

// --- Master XLSX truth ---
const wb = XLSX.readFile(path.join(FILES, 'Convergence 2026 Registration Form (Responses).xlsx'));
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
const seenEmails = new Set();
const master = {}; // eventName -> [{leadKey, collegeKey}]
for (const r of rows) {
  const email = String(r['Email Address'] ?? '').trim().toLowerCase();
  if (email && seenEmails.has(email)) continue;
  if (email) seenEmails.add(email);
  const lead = String(r['Full Name'] ?? '').trim();
  const collegeKey = norm(normalizeCollege(r['Name of the Institution ']) || '');
  for (const slot of SLOTS) {
    const ev = normalizeEvent(r[slot.eventKey]);
    if (!ev) continue;
    (master[ev] ??= []).push({ leadKey: norm(lead), collegeKey });
  }
}

// --- Event folders to scan ---
const EVENT_FOLDERS = [
  ['Math Minister', 'Maths Minister'],
  ['Vertex', 'VorTex_'],
  ["Traitor's Algorithm", 'Traitor_s Algorithm Folder'],
  ['Cipher & Coin', 'Cipher & Coin'],
  ['Numero Bingo', 'Numero Bingo'],
  ['Odds & Overdrive', 'ODDS AND OVERDRIVE FOLDER'],
  ['Math Heist', 'Math Heist_'],
  ['Project Infinity', 'PROJECT INFINITY'],
];

console.log('='.repeat(70));
console.log('PER-EVENT PARTICIPANT LISTS — CROSS VERIFICATION');
console.log('='.repeat(70));

let allOk = true;
let totalTeams = 0;

for (const [eventName, folder] of EVENT_FOLDERS) {
  const dir = path.join(FILES, folder);
  console.log(`\n■ ${eventName}`);

  if (!fs.existsSync(dir)) { console.log('  ✗ FOLDER MISSING'); allOk = false; continue; }
  const csvs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
  if (!csvs.length) { console.log('  ✗ NO CSV IN FOLDER'); allOk = false; continue; }

  const masterList = master[eventName] || [];
  const problems = [];
  const teams = []; // {leadKey, collegeKey}

  for (const csvFile of csvs) {
    const lines = fs.readFileSync(path.join(dir, csvFile), 'utf8').split(/\r?\n/).filter((l) => l.trim());
    for (let ln = 0; ln < lines.length; ln++) {
      const cells = parseCsvLine(lines[ln]);
      while (cells.length && cells[cells.length - 1] === '') cells.pop();
      const lineNo = ln + 1;
      if (cells.length < 3) { problems.push(`line ${lineNo}: too few columns`); continue; }

      const collegeRaw = cells[0];
      const lead = cells[1];
      const leadPhone = cleanPhone(cells[2]);

      if (!norm(collegeRaw)) problems.push(`line ${lineNo}: missing college`);
      if (!norm(lead)) { problems.push(`line ${lineNo}: missing participant name`); continue; }
      if (/^\d+$/.test(norm(lead))) problems.push(`line ${lineNo}: NAME COLUMN CONTAINS ONLY DIGITS ("${lead}") — row is misaligned`);
      if (!/^[6-9]\d{9}$/.test(leadPhone)) problems.push(`line ${lineNo}: invalid phone "${cells[2]}"`);

      const collegeKey = norm(normalizeCollege(collegeRaw) || '');
      const leadKey = norm(lead);

      // Intra-file duplicate check (same lead+college, ignoring case/format)
      if (teams.some((t) => t.leadKey === leadKey && t.collegeKey === collegeKey)) {
        problems.push(`line ${lineNo}: DUPLICATE team "${lead}" (${collegeRaw}) already listed`);
      } else {
        teams.push({ leadKey, collegeKey });
      }

      // Member pairs from col 3 onward
      let m = 3;
      while (m < cells.length) {
        const mName = cells[m];
        const mPhone = cleanPhone(cells[m + 1] ?? '');
        if (norm(mName)) {
          if (/^\d+$/.test(norm(mName))) problems.push(`line ${lineNo}: teammate slot contains only digits ("${mName}") — columns shifted?`);
          if (mPhone && !/^[6-9]\d{9}$/.test(mPhone)) problems.push(`line ${lineNo}: invalid teammate phone "${cells[m + 1]}"`);
        }
        m += 2;
      }
    }
  }

  totalTeams += teams.length;

  // Cross-check vs master: match by lead name within event.
  // Tolerant matching: ignore case/spaces/dots AND accept a match against ANY
  // name in a CSV row (coordinators sometimes reorder leads/teammates).
  const compact = (s) => String(s || '').replace(/[^a-z]/g, '');
  const rowNamesByCollege = new Map(); // collegeKey -> Set of compact names
  for (const t of teams) {
    if (!rowNamesByCollege.has(t.collegeKey)) rowNamesByCollege.set(t.collegeKey, new Set());
    rowNamesByCollege.get(t.collegeKey).add(compact(t.leadKey));
  }
  // collect every person named anywhere per college
  for (const csvFile of csvs) {
    const lines2 = fs.readFileSync(path.join(dir, csvFile), 'utf8').split(/\r?\n/).filter((l) => l.trim());
    for (const line of lines2) {
      const cells = parseCsvLine(line);
      while (cells.length && cells[cells.length - 1] === '') cells.pop();
      const collegeKey = norm(normalizeCollege(cells[0]) || '');
      if (!rowNamesByCollege.has(collegeKey)) continue;
      for (let m = 1; m < cells.length; m += 2) {
        const c = compact(cells[m]);
        if (c && !/^\d+$/.test(c)) rowNamesByCollege.get(collegeKey).add(c);
      }
    }
  }
  const notInCsv = masterList.filter((m) => {
    if (!m.leadKey) return false;
    const c = compact(m.leadKey);
    const pool = rowNamesByCollege.get(m.collegeKey);
    return !pool || ![...pool].some((n) => n === c || (n.includes(c) && c.length >= 5) || (c.includes(n) && n.length >= 5));
  });

  console.log(`  File(s): ${csvs.join(', ')}`);
  console.log(`  Teams in CSV: ${teams.length} · Registrations in XLSX: ${masterList.length}`);

  if (problems.length) {
    allOk = false;
    console.log(`  ⚠ ${problems.length} problem(s):`);
    for (const p of [...new Set(problems)].slice(0, 8)) console.log(`    • ${p}`);
    if (problems.length > 8) console.log(`    … and ${problems.length - 8} more`);
  }

  if (notInCsv.length) {
    console.log(`  ⚠ ${notInCsv.length} registered team(s) NOT found in CSV:`);
    for (const m of notInCsv.slice(0, 6)) console.log(`    • "${m.leadKey}" (${m.collegeKey})`);
    if (notInCsv.length > 6) console.log(`    … and ${notInCsv.length - 6} more`);
  }

  if (!problems.length && !notInCsv.length) console.log('  ✓ CLEAN & MATCHES MASTER');
  if (problems.length || notInCsv.length) allOk = false;
}

console.log('\n' + '='.repeat(70));
console.log(`TOTAL TEAMS ACROSS EVENT LISTS: ${totalTeams}`);
console.log(allOk ? '✓ ALL EVENT LISTS VERIFIED' : '⚠ FIX THE ISSUES ABOVE BEFORE USING THESE LISTS');
