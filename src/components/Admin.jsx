// ============================================================
// CONVERGENCE 2026 — Admin Panel (#/admin)
// Requires the admin server:  npm start
// Supports any number of core members logged in simultaneously.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { TOKEN_KEY, apiHeaders, fetchJson, getApiMode, getGhCfg, saveGhCfg, ghTest } from './adminShared';import { Dashboard, EventEditor, ScoreEntry, OnSpotEntry, RegistrationsViewer, ImportPanel, CheckInPanel, EventTeamsPanel } from './AdminPanels';

/* ---------------- Login ---------------- */
function Login({ onAuth }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const input = password.trim();

    // 1. If local server API is available, try server login first
    try {
      const body = await fetchJson('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      });
      sessionStorage.setItem(TOKEN_KEY, body.token);
      onAuth();
      setBusy(false);
      return;
    } catch {
      // Local server API was not available or password didn't match local server
    }

    // 2. Check PINs for cloud / remote mode
    const VALID_PINS = ['convergence26', '2026', 'admin', 'admin2026'];
    if (VALID_PINS.includes(input.toLowerCase())) {
      sessionStorage.setItem(TOKEN_KEY, 'pin_auth_ok');
      onAuth();
      setBusy(false);
      return;
    }

    // 3. If user pasted a GitHub token
    if (input.startsWith('github_pat_') || input.startsWith('ghp_')) {
      const cfg = getGhCfg();
      saveGhCfg({ ...cfg, token: input });
      sessionStorage.setItem(TOKEN_KEY, 'gh_token_ok');
      onAuth();
      setBusy(false);
      return;
    }

    setError('Incorrect PIN or password (try "convergence26" or "2026")');
    setBusy(false);
  };

  return (
    <div className="admin-wrap">
      <div className="admin-card admin-login">
        <div className="admin-logo">CONVERGENCE<span>2026</span></div>
        <div className="admin-subtitle">Core Member Access</div>
        <form onSubmit={submit}>
          <input
            type="password"
            className="admin-input"
            placeholder="Enter PIN (e.g. 2026 or convergence26)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary admin-btn" disabled={busy || !password}>
            {busy ? 'Checking...' : 'Enter Panel'}
          </button>
          {error && <div className="admin-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

/* ---------------- GitHub Sync settings ---------------- */
function GhSyncSettings({ onSaved }) {
  const cfg = getGhCfg();
  const [form, setForm] = useState({
    owner: cfg.owner || '', repo: cfg.repo || '', branch: cfg.branch || 'main', token: cfg.token || '',
  });
  const [status, setStatus] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveAndTest = async () => {
    setStatus('');
    saveGhCfg(form);
    try {
      const msg = await ghTest();
      setStatus(msg);
      onSaved?.();
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="admin-card" style={{ maxWidth: 640, marginBottom: 24 }}>
      <h4 style={{ fontFamily: "'Bebas Neue'", letterSpacing: 2, color: '#fff', margin: '0 0 4px' }}>
        GITHUB SYNC — edit results from anywhere
      </h4>
      <p className="admin-note">
        When the site runs on Vercel (no laptop server), saves commit straight to your repo and
        Vercel rebuilds automatically. Needs a GitHub <b>fine-grained token</b> with
        Contents: Read/Write on this repository only.
      </p>
      <div className="admin-form-grid">
        <label className="admin-field"><span>Owner / Organisation</span>
          <input className="admin-input" value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. convergence-christ" />
        </label>
        <label className="admin-field"><span>Repository</span>
          <input className="admin-input" value={form.repo} onChange={(e) => set('repo', e.target.value)} placeholder="e.g. convergence-site" />
        </label>
        <label className="admin-field"><span>Branch</span>
          <input className="admin-input" value={form.branch} onChange={(e) => set('branch', e.target.value)} />
        </label>
        <label className="admin-field"><span>GitHub Token</span>
          <input className="admin-input" type="password" value={form.token}
            onChange={(e) => set('token', e.target.value)} placeholder="github_pat_..." />
        </label>
      </div>
      <div className="admin-actions">
        <button className="btn-primary admin-btn" onClick={saveAndTest}>Save & Test Connection</button>
        {status && <span className={status.includes('✓') ? 'admin-ok' : 'admin-error'}>{status}</span>}
      </div>
    </div>
  );
}

function RemoteOnlyNotice({ feature }) {
  return (
    <div className="results-banner" style={{ textAlign: 'left', lineHeight: 1.8 }}>
      🔒 <b>{feature}</b> needs the laptop admin server running (<code>npm start</code>).<br />
      On Vercel you can still use <b>Edit Events</b> and <b>Enter Results</b> — they sync via GitHub.
      Configure it under ☁ GitHub Sync in the header.
    </div>
  );
}

/* ---------------- Shell ---------------- */
const TABS = [
  ['checkin', 'Check-In'],
  ['teams', 'Event Teams'],
  ['dashboard', 'Dashboard'],
  ['events', 'Edit Events'],
  ['scores', 'Enter Results'],
  ['onspot', 'On-Spot Reg.'],
  ['import', 'Import CSV'],
  ['registrations', 'Registrations'],
];

export default function Admin() {
  const [authed, setAuthed] = useState(Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [tokenValid, setTokenValid] = useState(null); // null = checking
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [apiMode, setApiMode] = useState('checking'); // 'local' | 'remote'
  const [showGh, setShowGh] = useState(false);

  // Resolve environment once
  useEffect(() => {
    getApiMode().then((m) => { setApiMode(m); if (m === 'remote') setShowGh(true); });
  }, []);

  // Re-validate stored token on mount
  useEffect(() => {
    if (!authed) return;
    getApiMode().then((m) => {
      setApiMode(m);
      const tokenVal = sessionStorage.getItem(TOKEN_KEY);
      if (m === 'remote' || tokenVal === 'pin_auth_ok' || tokenVal === 'gh_token_ok' || tokenVal === 'gh_test_ok') {
        setTokenValid(true);
        if (m === 'remote') setShowGh(true);
        return;
      }
      fetchJson('/api/admin/registrations', { headers: apiHeaders() })
        .then(() => setTokenValid(true))
        .catch(() => {
          sessionStorage.removeItem(TOKEN_KEY);
          setAuthed(false);
          setTokenValid(null);
        });
    });
  }, [authed]);

  const notify = useCallback((message, isError = false) => {
    clearTimeout(toastTimer.current);
    setToast({ message, error: isError });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
  };

  if (!authed) return <Login onAuth={() => { setTokenValid(true); setAuthed(true); }} />;
  if (tokenValid === null && authed) return <div className="admin-loading">Checking access...</div>;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-logo">
          CONVERGENCE<span>2026</span> <em>/ ADMIN</em>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`admin-badge ${apiMode === 'local' ? 'ok' : 'warn'}`}>
            {apiMode === 'checking' ? '…' : apiMode === 'local' ? 'Laptop Server' : 'Cloud (Vercel)'}
          </span>
          <button className="filter-pill" onClick={() => setShowGh((v) => !v)}>☁ GitHub Sync</button>
          <button className="filter-pill" onClick={logout}>Logout</button>
        </div>
      </div>

      {showGh && (
        <div style={{ maxWidth: 640, margin: '0 auto 24px' }}>
          <GhSyncSettings onSaved={() => notify('GitHub connection saved')} />
        </div>
      )}

      <div className="participant-tabs admin-tabs">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={`participant-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {(() => {
          const LOCAL_ONLY = {
            teams: 'Event Teams',
            onspot: 'On-Spot Registration',
            import: 'CSV Import',
            registrations: 'Registrations',
          };
          if (apiMode === 'remote' && LOCAL_ONLY[tab]) {
            return <RemoteOnlyNotice feature={LOCAL_ONLY[tab]} />;
          }
          switch (tab) {
            case 'checkin': return <CheckInPanel notify={notify} />;
            case 'teams': return <EventTeamsPanel notify={notify} />;
            case 'dashboard': return <Dashboard goTo={setTab} />;
            case 'events': return <EventEditor notify={notify} />;
            case 'scores': return <ScoreEntry notify={notify} />;
            case 'onspot': return <OnSpotEntry notify={notify} />;
            case 'import': return <ImportPanel notify={notify} />;
            case 'registrations': return <RegistrationsViewer notify={notify} />;
            default: return null;
          }
        })()}
      </div>

      {toast && (
        <div className={`admin-toast ${toast.error ? 'error' : ''}`}>
          {toast.error ? '✗ ' : '✓ '}{toast.message}
        </div>
      )}
    </div>
  );
}
