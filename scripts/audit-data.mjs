// ============================================================
// CONVERGENCE 2026 — Data Integrity Audit
// Scans registration files for duplicates, invalid contacts,
// event-count mismatches, and status inconsistencies.
//
// Usage:
//   npm run audit
// ============================================================

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { loadOnspot, SLOTS, normalizePhone } from './build-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const xlsxPath = path.join(ROOT, 'files', 'Convergence 2026 Registration Form (Responses).xlsx');

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function auditXlsx() {
  const issues = [];
  const seen = { email: new Map(), phone: new Map(), nameCollege: new Map() };
  let count = 0;

  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  let rowNo = 1;

  for (const r of rows) {
    rowNo++;
    count++;
    const lead = String(r['Full Name'] ?? '').trim();
    const label = lead || `row ${rowNo}`;
    const email = norm(r['Email Address']);
    const phone = normalizePhone(r['Whatsapp Number']);
    const college = String(r['Name of the Institution '] ?? '').trim();
    const declaredEvents = Number(r['Please indicate the number of events you are registering for.'] ?? 0);

    if (!lead) issues.push(`Row ${rowNo}: MISSING lead name`);
    if (!email) issues.push(`Row ${rowNo} (${label}): missing email`);
    if (!college) issues.push(`Row ${rowNo} (${label}): missing institution`);

    if (!phone) issues.push(`Row ${rowNo} (${label}): missing WhatsApp number`);
    else if (!/^[6-9]\d{9}$/.test(phone)) issues.push(`Row ${rowNo} (${label}): suspicious phone "${phone}"`);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push(`Row ${rowNo} (${label}): malformed email "${r['Email Address']}"`);

    // Declared vs selected events (across all three slots)
    const chosen = SLOTS.filter((s) => String(r[s.eventKey] ?? '').trim()).length;
    if (declaredEvents && declaredEvents !== chosen) {
      issues.push(`Row ${rowNo} (${lead}): declared ${declaredEvents} event(s) but selected ${chosen}`);
    }
    if (chosen === 0) issues.push(`Row ${rowNo} (${label}): NO events selected`);

    // Duplicates
    if (email && seen.email.has(email)) issues.push(`Row ${rowNo}: DUPLICATE email ${email} (first seen row ${seen.email.get(email)}) — duplicate submission ignored by pipeline`);
    else if (email) seen.email.set(email, rowNo);

    if (phone && seen.phone.has(phone)) issues.push(`Row ${rowNo}: DUPLICATE phone ${phone} (first seen row ${seen.phone.get(phone)} — may be teammates sharing a number)`);
    else if (phone) seen.phone.set(phone, rowNo);

    const nameKey = `${norm(lead)}|${norm(college)}`;
    if (seen.nameCollege.has(nameKey)) issues.push(`Row ${rowNo}: DUPLICATE name+college "${lead}" (first seen row ${seen.nameCollege.get(nameKey)})`);
    else seen.nameCollege.set(nameKey, rowNo);

    // Team size sanity per slot
    for (const slot of SLOTS) {
      const ev = String(r[slot.eventKey] ?? '');
      if (!ev.trim()) continue;
      const memberCount = slot.memberCols.filter((c) => String(r[c] ?? '').trim()).length;
      const match = ev.match(/\((\d+) Participants?\)/);
      if (match && memberCount && Number(match[1]) > memberCount + 1) {
        issues.push(`Row ${rowNo} (${lead}): "${ev.split('(')[0].trim()}" needs ${match[1]} participants but only ${memberCount + 1} names listed`);
      }
    }

    // Status/payment consistency
    const status = norm(r['Status ']);
    const paidRaw = String(r['paid'] ?? '').trim().toLowerCase();
    const isPaid = ['1', 'true', 'yes'].includes(paidRaw);
    if (!['completed', 'not completed', ''].includes(status)) issues.push(`Row ${rowNo} (${lead}): odd status "${status}"`);
    if (status === 'not completed' && isPaid) issues.push(`Row ${rowNo} (${lead}): status "Not Completed" but marked paid`);
  }
  return { count, issues };
}

function auditOnspot() {
  const issues = [];
  const list = loadOnspot();
  for (const o of list) {
    if (!o.lead) issues.push(`On-spot #${o.id}: missing name`);
    if (!(o.events || []).length) issues.push(`On-spot "${o.lead}": no events`);
    if (o.phone && !/^[6-9]\d{9}$/.test(normalizePhone(o.phone))) issues.push(`On-spot "${o.lead}": suspicious phone "${o.phone}"`);
  }
  return { count: list.length, issues };
}

// ---- Run ----
console.log('='.repeat(64));
console.log('DATA INTEGRITY AUDIT');
console.log('='.repeat(64));

let exitCode = 0;
for (const [name, result] of [
  ['Registration form (xlsx)', fs.existsSync(xlsxPath) ? auditXlsx() : { count: 0, issues: ['file not found'] }],
  ['On-spot entries', auditOnspot()],
]) {
  console.log(`\n■ ${name} — ${result.count} record(s)`);
  if (!result.issues.length) console.log('  ✓ clean');
  else {
    console.log(`  ⚠ ${result.issues.length} issue(s):`);
    for (const i of result.issues) console.log('    • ' + i);
    exitCode = 1;
  }
}
process.exit(exitCode);
