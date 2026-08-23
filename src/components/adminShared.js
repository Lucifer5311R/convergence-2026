// Shared helpers for the admin panel

export const TOKEN_KEY = 'cv_admin_token';

export const apiHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY) || ''}`,
});

export function fetchJson(url, options) {
  return fetch(url, options).then(async (r) => {
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || `Request failed (${r.status})`);
    return body;
  });
}

// ------------------------------------------------------------
// Environment detection: local admin server vs Vercel static
// ------------------------------------------------------------
let _apiMode = null; // 'local' | 'remote'
export async function getApiMode() {
  if (_apiMode) return _apiMode;
  try {
    const r = await fetch('/api/data');
    _apiMode = r.ok ? 'local' : 'remote';
  } catch {
    _apiMode = 'remote';
  }
  return _apiMode;
}

// ------------------------------------------------------------
// GitHub sync — lets the Vercel-hosted admin commit data changes,
// which triggers an automatic site rebuild.
// Config lives in localStorage per browser.
// ------------------------------------------------------------
const GH_KEY = 'cv_gh_sync';

export function getGhCfg() {
  try { return JSON.parse(localStorage.getItem(GH_KEY)) || {}; }
  catch { return {}; }
}

export function saveGhCfg(cfg) {
  localStorage.setItem(GH_KEY, JSON.stringify(cfg));
}

function ghHeaders(cfg) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

function ghUrl(cfg, path, query = '') {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}${query}`;
}

// UTF-8 safe base64
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function ghRequest(cfg, path, query, options) {
  const r = await fetch(ghUrl(cfg, path, query), {
    ...options,
    headers: ghHeaders(cfg),
  });
  if (r.status === 404) return null;
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message || `GitHub API error ${r.status}`);
  return body;
}

// Returns { sha, content } or null if file doesn't exist
export async function ghGetFile(path) {
  const cfg = getGhCfg();
  const j = await ghRequest(cfg, path, `?ref=${encodeURIComponent(cfg.branch || 'main')}`, {});
  if (!j) return null;
  return { sha: j.sha, content: fromBase64(j.content || '') };
}

// Commit a file; returns commit info
export async function ghPutFile(path, content, message) {
  const cfg = getGhCfg();
  const existing = await ghGetFile(path);
  const j = await ghRequest(cfg, path, '', {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch: cfg.branch || 'main',
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  return { commit: j?.commit?.sha?.slice(0, 7), path };
}

// Validate credentials by reading the repo
export async function ghTest() {
  const cfg = getGhCfg();
  if (!cfg.owner || !cfg.repo || !cfg.token) throw new Error('Fill owner, repo and token first');
  const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
    headers: ghHeaders(cfg),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message || `GitHub error ${r.status}`);
  return `Connected to ${body.full_name} ✓`;
}

export function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// RFC-ish CSV line parser (handles quoted fields)
export function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (const ch of String(line)) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

// Repo paths for GitHub-synced stores
export const GH_SCORES_PATH = 'data-admin/scores.csv';
export const GH_EVENTS_PATH = 'data-admin/events-overrides.json';
export const GH_ATTENDANCE_PATH = 'data-admin/attendance.json';
export const GH_ONSPOT_PUBLIC_PATH = 'data-admin/onspot-public.json';

export const escCsv = (v) => {
  const s = String(v ?? '').trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
