// ============================================================
// CONVERGENCE 2026 — Admin Panels
// ============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiHeaders, fetchJson, downloadCsv, parseCsvLine, getApiMode, ghGetFile, ghPutFile, GH_SCORES_PATH, GH_EVENTS_PATH, GH_ATTENDANCE_PATH, GH_ONSPOT_PUBLIC_PATH, escCsv } from './adminShared';
import CHECKIN_DATA from '../data/generated/checkin.json';
import BUNDLED_EVENTS from '../data/generated/events.json';
import BUNDLED_PARTICIPANTS from '../data/generated/participants.json';
import BUNDLED_LEADERBOARD from '../data/generated/leaderboard.json';

// Fallback data assembled from build-time JSON for remote/Vercel mode
const FALLBACK_DATA = {
  events: BUNDLED_EVENTS,
  participants: BUNDLED_PARTICIPANTS,
  leaderboard: BUNDLED_LEADERBOARD,
};

function useApiData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchJson('/api/data')
      .then(setData)
      .catch(() => setData(FALLBACK_DATA));
  }, []);
  return data;
}

/* ---------------- Event Editor ---------------- */
const EVENT_FIELDS = [
  ['name', 'Event Name'],
  ['tags', 'Tags'],
  ['quote', 'Quote'],
  ['tagline', 'Tagline'],
  ['prizes', 'Prize Pool'],
  ['teamSize', 'Team Size'],
  ['duration', 'Duration'],
  ['difficulty', 'Difficulty'],
  ['dateTime', 'Date'],
  ['time', 'Time'],
  ['venue', 'Venue'],
  ['posterUrl', 'Poster URL (/gallery/...)'],
  ['googleFormUrl', 'Google Form URL'],
];

export function EventEditor({ notify }) {
  const data = useApiData();
  const events = data?.events || [];
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = (id) => {
    setSelectedId(id);
    const ev = events.find((e) => String(e.id) === String(id));
    setDraft(ev ? structuredClone(ev) : null);
  };

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      const payload = {};
      for (const [key] of EVENT_FIELDS) payload[key] = draft[key] ?? '';
      payload.rules = (draft.rules || []).filter(Boolean);

      const mode = await getApiMode();
      if (mode === 'local') {
        const body = await fetchJson('/api/admin/events', {
          method: 'PUT',
          headers: apiHeaders(),
          body: JSON.stringify({ id: draft.id, ...payload }),
        });
        notify(body.message + ' — refresh the public page to see it');
      } else {
        // Cloud mode: commit override to GitHub → Vercel auto-rebuilds
        const j = await ghGetFile(GH_EVENTS_PATH);
        let overrides = {};
        if (j?.content) {
          try { overrides = JSON.parse(j.content); } catch { overrides = {}; }
        }
        overrides[draft.id] = { ...(overrides[draft.id] || {}), ...payload };
        await ghPutFile(
          GH_EVENTS_PATH,
          JSON.stringify(overrides, null, 2),
          `admin: update event ${draft.name}`
        );
        notify(`Committed ✓ — Vercel will rebuild; live in ~2 minutes`);
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="admin-loading">Loading events...</div>;

  return (
    <div>
      <div className="admin-row">
        <select className="admin-input" value={selectedId} onChange={(e) => pick(e.target.value)}>
          <option value="">— Select an event to edit —</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{String(e.id).padStart(2, '0')} · {e.name}</option>
          ))}
        </select>
      </div>

      {draft && (
        <div className="admin-form-grid">
          {EVENT_FIELDS.map(([key, label]) => (
            <label key={key} className="admin-field">
              <span>{label}</span>
              <input className="admin-input" value={draft[key] ?? ''} onChange={(e) => setField(key, e.target.value)} />
            </label>
          ))}

          <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
            <span>Description</span>
            <textarea className="admin-input" rows={3} value={draft.description ?? ''}
              onChange={(e) => setField('description', e.target.value)} />
          </label>

          <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
            <span>Rules — one per line</span>
            <textarea className="admin-input" rows={6} value={(draft.rules || []).join('\n')}
              onChange={(e) => setField('rules', e.target.value.split('\n'))} />
          </label>

          <div className="admin-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="btn-primary admin-btn" onClick={save} disabled={busy}>
              {busy ? 'Saving & rebuilding...' : 'Save Changes'}
            </button>
            <span className="admin-note">Rebuilds the public site automatically (~2s)</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Scores Entry ---------------- */
export function ScoreEntry({ notify }) {
  const data = useApiData();
  const colleges = useMemo(() => data?.participants?.colleges?.map((c) => c.name) || [], [data]);
  const eventNames = useMemo(() => data?.events?.map((e) => e.name) || [], [data]);

  const [event, setEvent] = useState('');
  const [rows, setRows] = useState([{ college: '', team: '', value: '' }]);
  const [busy, setBusy] = useState(false);

  // Load existing results into editable rows when switching events
  useEffect(() => {
    if (!data || !event) return;
    const existing = data.leaderboard?.events?.[event];
    if (existing && existing.length) {
      setRows(existing.map((r) => ({ college: r.college, team: r.team, value: String(r.rank) })));
    } else {
      setRows([{ college: '', team: '', value: '' }]);
    }
  }, [event, data]);

  const addRow = () => setRows((r) => [...r, { college: '', team: '', value: '' }]);
  const setRow = (i, key, val) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: val } : row)));
  const removeRow = (i) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r));

  const save = async () => {
    setBusy(true);
    try {
      const valid = rows
        .filter((r) => r.college.trim() && Number.isFinite(Number(r.value)) && Number(r.value) > 0)
        .sort((a, b) => Number(a.value) - Number(b.value))
        .map((r) => ({ ...r, event }));

      const mode = await getApiMode();
      if (mode === 'local') {
        const body = await fetchJson('/api/admin/scores', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ rows: valid, replaceEvent: event }),
        });
        notify(body.message);
      } else {
        // Cloud mode: read scores.csv from repo, replace this event's rows, commit
        const j = await ghGetFile(GH_SCORES_PATH);
        const lines = j?.content
          ? j.content.split(/\r?\n/).filter((l) => l.trim())
          : ['College,Team,Event,Rank'];
        const kept = [lines[0] || 'College,Team,Event,Rank'];
        for (const line of lines.slice(1)) {
          if (parseCsvLine(line)[2] === event) continue; // drop old rows of this event
          kept.push(line);
        }
        for (const r of valid) kept.push([escCsv(r.college), escCsv(r.team), escCsv(r.event), Number(r.value)].join(','));
        await ghPutFile(GH_SCORES_PATH, kept.join('\n') + '\n', `admin: results for ${event}`);
        notify('Committed ✓ — leaderboard updates when Vercel rebuilds (~2 min)');
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete ALL results for ALL events?')) return;
    try {
      const mode = await getApiMode();
      if (mode === 'local') {
        const body = await fetchJson('/api/admin/scores', { method: 'DELETE', headers: apiHeaders() });
        notify(body.message);
      } else {
        await ghPutFile(GH_SCORES_PATH, 'College,Team,Event,Rank\n', 'admin: clear all results');
        notify('Committed ✓ — results cleared after rebuild');
      }
    } catch (err) {
      notify(err.message, true);
    }
  };

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="admin-input" style={{ maxWidth: 320 }} value={event}
          onChange={(e) => setEvent(e.target.value)}>
          <option value="">— Select event —</option>
          {eventNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        {event && (
          <span className="admin-note">
            Saving replaces this event's results. Points auto-calculated: 1st=10 · 2nd=7 · 3rd=5 · 4th=3 · rest=1
          </span>
        )}
      </div>

      {event && (
        <>
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Rank</th><th>Team</th><th>College</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input className="admin-input" style={{ width: 80 }} placeholder="1"
                      type="number" min="1" value={row.value} onChange={(e) => setRow(i, 'value', e.target.value)} />
                  </td>
                  <td>
                    <input className="admin-input" placeholder="Team name" value={row.team}
                      onChange={(e) => setRow(i, 'team', e.target.value)} />
                  </td>
                  <td>
                    <input className="admin-input" list={`colleges-${i}`} placeholder="College" value={row.college}
                      onChange={(e) => setRow(i, 'college', e.target.value)} />
                    <datalist id={`colleges-${i}`}>{colleges.map((c) => <option key={c} value={c} />)}</datalist>
                  </td>
                  <td><button className="admin-mini-btn" onClick={() => removeRow(i)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-actions">
            <button className="filter-pill" onClick={addRow}>+ Add Row</button>
            <button className="btn-primary admin-btn" onClick={save} disabled={busy}>
              {busy ? 'Saving...' : `Save ${event} Results`}
            </button>
            <button className="filter-pill admin-danger" onClick={clearAll}>Clear ALL Events</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- On-Spot Registration ---------------- */
export function OnSpotEntry({ notify }) {
  const data = useApiData();
  const colleges = useMemo(() => data?.participants?.colleges?.map((c) => c.name) || [], [data]);
  const eventNames = useMemo(() => data?.events?.map((e) => e.name) || [], [data]);

  const [form, setForm] = useState({ lead: '', phone: '', email: '', college: '', department: '', paid: false });
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [onspotList, setOnspotList] = useState([]);

  const loadOnspot = useCallback(() => {
    fetchJson('/api/admin/registrations', { headers: apiHeaders() })
      .then((b) => setOnspotList(b.registrations.filter((x) => x.source === 'On-Spot')))
      .catch(() => {});
  }, []);
  useEffect(loadOnspot, [loadOnspot]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleEvent = (name) =>
    setEvents((evs) => (evs.includes(name) ? evs.filter((e) => e !== name) : [...evs, name]));

  const addMember = () => setMembers((m) => [...m, { name: '', phone: '' }].slice(0, 6));
  const setMember = (i, key, val) =>
    setMembers((m) => m.map((x, j) => (j === i ? { ...x, [key]: val } : x)));
  const removeMember = (i) => setMembers((m) => m.filter((_, j) => j !== i));

  const submit = async () => {
    if (!form.lead.trim()) return notify('Participant name is required', true);
    if (!events.length) return notify('Select at least one event', true);
    setBusy(true);
    try {
      const body = await fetchJson('/api/admin/onspot', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ ...form, events, members: members.filter((m) => m.name.trim()) }),
      });
      notify(body.message);
      setForm({ lead: '', phone: '', email: '', college: '', department: '', paid: false });
      setEvents([]);
      setMembers([]);
      loadOnspot();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this on-spot entry?')) return;
    try {
      const body = await fetchJson('/api/admin/onspot', {
        method: 'DELETE',
        headers: apiHeaders(),
        body: JSON.stringify({ id }),
      });
      notify(body.message);
      loadOnspot();
    } catch (err) {
      notify(err.message, true);
    }
  };

  return (
    <div>
      <div className="admin-form-grid">
        <label className="admin-field"><span>Participant Name *</span>
          <input className="admin-input" value={form.lead} onChange={(e) => setField('lead', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </label>
        <label className="admin-field"><span>WhatsApp Number</span>
          <input className="admin-input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        </label>
        <label className="admin-field"><span>Email</span>
          <input className="admin-input" value={form.email} onChange={(e) => setField('email', e.target.value)} />
        </label>
        <label className="admin-field"><span>College</span>
          <input className="admin-input" list="onspot-colleges" value={form.college}
            onChange={(e) => setField('college', e.target.value)} />
          <datalist id="onspot-colleges">{colleges.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="admin-field"><span>Department</span>
          <input className="admin-input" value={form.department} onChange={(e) => setField('department', e.target.value)} />
        </label>
        <label className="admin-field"><span>Payment Received</span>
          <button type="button" className={`filter-pill ${form.paid ? 'active' : ''}`}
            onClick={() => setField('paid', !form.paid)} style={{ cursor: 'pointer' }}>
            {form.paid ? 'Paid ✓' : 'Unpaid'}
          </button>
        </label>

        <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
          <span>Events * ({events.length} selected)</span>
          <div className="filter-pills" style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
            {eventNames.map((n) => (
              <button key={n} type="button" className={`filter-pill ${events.includes(n) ? 'active' : ''}`}
                onClick={() => toggleEvent(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
          <span>Teammates ({members.length}/6)</span>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="admin-input" placeholder={`Teammate ${i + 2} name`} value={m.name}
                onChange={(e) => setMember(i, 'name', e.target.value)} />
              <input className="admin-input" placeholder="Phone" style={{ maxWidth: 180 }} value={m.phone}
                onChange={(e) => setMember(i, 'phone', e.target.value)} />
              <button className="admin-mini-btn" onClick={() => removeMember(i)}>✕</button>
            </div>
          ))}
          {members.length < 6 && (
            <button className="filter-pill" onClick={addMember} style={{ alignSelf: 'flex-start' }}>+ Add Teammate</button>
          )}
        </div>
      </div>

      <div className="admin-actions">
        <button className="btn-primary admin-btn" onClick={submit} disabled={busy}>
          {busy ? 'Saving...' : 'Register On-Spot'}
        </button>
        <span className="admin-note">Paid entries are auto-verified and instantly counted in the leaderboard</span>
      </div>

      {onspotList.length > 0 && (
        <>
          <h4 className="admin-section-title">ON-SPOT ENTRIES ({onspotList.length})</h4>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>College</th><th>Phone</th><th>Events</th><th>Team</th><th>Paid</th><th></th></tr></thead>
            <tbody>
              {onspotList.map((o) => (
                <tr key={o.id || o.key}>
                  <td>{o.lead}</td>
                  <td>{o.college}</td>
                  <td>{o.phone}</td>
                  <td>{o.events.join(', ')}</td>
                  <td>{o.members.map((m) => m.name).join(', ') || '—'}</td>
                  <td>{o.paid === '1' ? <span className="admin-badge ok">Paid</span> : <span className="admin-badge warn">Unpaid</span>}</td>
                  <td><button className="admin-mini-btn" onClick={() => remove(o.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* ---------------- Registrations Viewer ---------------- */
export function RegistrationsViewer({ notify }) {
  const [reg, setReg] = useState(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [hideVerified, setHideVerified] = useState(false);

  const load = useCallback(() => {
    fetchJson('/api/admin/registrations', { headers: apiHeaders() })
      .then(setReg)
      .catch((e) => notify(e.message, true));
  }, [notify]);
  useEffect(load, [load]);

  const toggleField = async (row, field) => {
    setReg((prev) => ({
      ...prev,
      registrations: prev.registrations.map((r) => (r.key === row.key ? { ...r, [field]: !r[field] } : r)),
    }));
    try {
      await fetchJson('/api/admin/verify', {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ key: row.key, patch: { [field]: !row[field] } }),
      });
    } catch (err) {
      notify(err.message, true);
      load();
    }
  };

  const stats = useMemo(() => {
    if (!reg) return null;
    return {
      total: reg.count,
      verified: reg.registrations.filter((r) => r.verified).length,
      unpaid: reg.registrations.filter((r) => r.paid !== '1').length,
      onspot: reg.registrations.filter((r) => r.source === 'On-Spot').length,
    };
  }, [reg]);

  const filtered = useMemo(() => {
    if (!reg) return [];
    const s = search.toLowerCase();
    return reg.registrations.filter((r) => {
      if (hideVerified && r.verified) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      return s === '' ||
        r.lead.toLowerCase().includes(s) ||
        (r.college || '').toLowerCase().includes(s) ||
        (r.phone || '').includes(search) ||
        r.members.some((m) => m.name.toLowerCase().includes(s));
    });
  }, [reg, search, sourceFilter, hideVerified]);

  const exportCsv = () => {
    downloadCsv(`convergence-registrations-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Lead', 'Phone', 'Email', 'College', 'Department', 'Events', 'Members', 'Source', 'Verified', 'Paid'],
      ...filtered.map((r) => [
        r.lead, r.phone, r.email, r.college || r.collegeRaw, r.department,
        r.events.join('; '), r.members.map((m) => `${m.name}${m.phone ? ` (${m.phone})` : ''}`).join('; '),
        r.source, r.verified ? 'yes' : 'no', r.paid === '1' ? 'yes' : 'no',
      ]),
    ]);
    notify(`Exported ${filtered.length} registrations`);
  };

  if (!reg) return <div className="admin-loading">Loading registrations...</div>;

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="admin-input" style={{ maxWidth: 300 }} placeholder="Search name, college or phone..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {[['all', 'All'], ['Online Form', 'Online'], ['On-Spot', 'On-Spot']].map(([key, label]) => (
          <button key={key} className={`filter-pill ${sourceFilter === key ? 'active' : ''}`}
            onClick={() => setSourceFilter(key)} style={{ cursor: 'pointer' }}>{label}</button>
        ))}
        <button className="filter-pill" onClick={() => setHideVerified((v) => !v)} style={{ cursor: 'pointer' }}>
          {hideVerified ? 'Show Verified Too' : 'Hide Verified'}
        </button>
        <button className="filter-pill" onClick={load}>Refresh</button>
        <button className="filter-pill" onClick={exportCsv}>Export CSV</button>
      </div>

      {stats && (
        <div className="stat-cards">
          <div className="stat-card"><b>{stats.total}</b><span>Total</span></div>
          <div className="stat-card ok"><b>{stats.verified}</b><span>Verified</span></div>
          <div className="stat-card warn"><b>{stats.unpaid}</b><span>Unpaid</span></div>
          <div className="stat-card warn"><b>{stats.onspot}</b><span>On-Spot</span></div>
        </div>
      )}

      <p className="admin-note">⚠ Contact details are private — never shown on the public site. Use ✓ buttons at the desk.</p>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Lead</th><th>Contact</th><th>College</th><th>Events</th><th>Members</th><th>Verify</th><th>Paid</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.key} style={{ opacity: r.verified ? 0.55 : 1 }}>
                <td>
                  {r.lead || <em style={{ color: '#666' }}>(no name)</em>}
                  <div><span className={`admin-badge ${r.source === 'On-Spot' ? 'warn' : ''}`}>{r.source}</span>
                    {r.department && <span style={{ color: '#666', fontSize: '0.7rem' }}> {r.department}</span>}</div>
                </td>
                <td>
                  <div>{r.phone}</div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>{r.email}</div>
                </td>
                <td>{r.college || r.collegeRaw}</td>
                <td>{r.events.join(', ')}</td>
                <td>{r.members.map((m) => m.name).join(', ') || '—'}</td>
                <td>
                  <button className={`admin-mini-btn ${r.verified ? 'verified-on' : ''}`}
                    onClick={() => toggleField(r, 'verified')}>
                    {r.verified ? '✓ Verified' : 'Unverified'}
                  </button>
                </td>
                <td>
                  <button className={`admin-mini-btn ${r.paid === '1' ? 'verified-on' : ''}`}
                    onClick={() => toggleField(r, 'paid')}>
                    {r.paid === '1' ? '✓ Paid' : 'Unpaid'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="admin-loading">No matches.</div>}
      </div>
    </div>
  );
}

/* ---------------- CSV Import ---------------- */
function parseCsvText(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const IMPORT_TARGETS = {
  scores: {
    label: 'Results / Scores',
    fields: [
      { key: 'college', label: 'College', required: true, guesses: ['college', 'institution', 'university', 'school'] },
      { key: 'team', label: 'Team', required: false, guesses: ['team'] },
      { key: 'event', label: 'Event', required: false, guesses: ['event'] },
      { key: 'value', label: 'Rank / Score', required: true, guesses: ['rank', 'score', 'position', 'point', 'value'] },
    ],
    hint: 'Rows are appended to the results file. Use rank numbers for points to be auto-calculated.',
  },
  registrations: {
    label: 'Registrations',
    fields: [
      { key: 'name', label: 'Participant Name', required: true, guesses: ['name', 'participant', 'full'] },
      { key: 'college', label: 'College', required: true, guesses: ['college', 'institution', 'university', 'school'] },
      { key: 'phone', label: 'Phone / WhatsApp', required: false, guesses: ['phone', 'whatsapp', 'mobile', 'contact'] },
      { key: 'email', label: 'Email', required: false, guesses: ['mail'] },
      { key: 'event', label: 'Event', required: false, guesses: ['event'] },
      { key: 'paid', label: 'Paid (yes/no)', required: false, guesses: ['paid', 'payment', 'fee'] },
    ],
    hint: 'Duplicates (same name+college+phone) are skipped automatically.',
  },
  participants: {
    label: 'Participants List',
    fields: [
      { key: 'name', label: 'Participant Name', required: true, guesses: ['name', 'participant'] },
      { key: 'college', label: 'College', required: true, guesses: ['college', 'institution', 'university', 'school'] },
      { key: 'phone', label: 'Phone / WhatsApp', required: false, guesses: ['phone', 'contact', 'mobile', 'whatsapp'] },
      { key: 'email', label: 'Email', required: false, guesses: ['mail'] },
    ],
    hint: 'Updates the master participant list. Merge mode skips duplicates (same name+college).',
  },
};

const normHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z]/g, '');

// Matches an uploaded filename against known events, e.g.
// "math heist finals.csv" -> "Math Heist"
const FILENAME_EVENT_MATCHERS = [
  ['math minister', 'Math Minister'],
  ['minister', 'Math Minister'],
  ['vortex', 'Vertex'],
  ['vertex', 'Vertex'],
  ['cipher', 'Cipher & Coin'],
  ['heist', 'Math Heist'],
  ['traitor', "Traitor's Algorithm"],
  ['odds', 'Odds & Overdrive'],
  ['overdrive', 'Odds & Overdrive'],
  ['bingo', 'Numero Bingo'],
  ['infinity', 'Project Infinity'],
];

function detectEventFromFilename(filename) {
  const f = String(filename || '').toLowerCase();
  for (const [needle, eventName] of FILENAME_EVENT_MATCHERS) {
    if (f.includes(needle)) return eventName;
  }
  return '';
}

export function ImportPanel({ notify }) {
  const data = useApiData();
  const eventNames = useMemo(() => data?.events?.map((e) => e.name) || [], [data]);

  const [type, setType] = useState('registrations');
  const [parsed, setParsed] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({}); // fieldKey -> columnIndex
  const [defaultEvent, setDefaultEvent] = useState('');
  const [replaceMaster, setReplaceMaster] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileNameRef = useRef('');

  const target = IMPORT_TARGETS[type];

  // Reset mapping when switching type
  useEffect(() => { setMapping({}); }, [type]);

  const handleFile = (file) => {
    if (!file) return;
    fileNameRef.current = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const all = parseCsvText(String(reader.result));
      if (all.length < 2) return notify('CSV needs a header row and at least one data row', true);
      const headers = all[0];
      const rows = all.slice(1);

      // Auto-map by header-name guessing
      const initial = {};
      for (const f of target.fields) {
        const idx = headers.findIndex((h) => f.guesses.some((g) => normHeader(h).includes(g)));
        if (idx >= 0) initial[f.key] = idx;
      }
      setParsed({ headers, rows });
      setMapping(initial);

      // Auto-detect event from filename (e.g. "Math Heist finals.csv")
      if (type !== 'participants') {
        const detected = detectEventFromFilename(file.name);
        if (detected && !initial.event && eventNames.includes(detected)) {
          setDefaultEvent(detected);
          notify(`Event auto-detected from filename: ${detected}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const mappedObjects = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((cells) => {
      const obj = {};
      for (const f of target.fields) {
        const ci = mapping[f.key];
        if (ci != null && cells[ci] != null) obj[f.key] = String(cells[ci]).trim();
      }
      return obj;
    }).filter((o) => Object.keys(o).length > 0);
  }, [parsed, mapping, target]);

  const validCount = useMemo(() =>
    mappedObjects.filter((o) => target.fields.filter((f) => f.required).every((f) => o[f.key])).length,
    [mappedObjects, target]
  );

  const doImport = async () => {
    if (validCount === 0) return notify('Nothing valid to import — check required mappings', true);
    const hasEventColumn = mapping.event != null;
    if (type !== 'participants' && !hasEventColumn && !defaultEvent) {
      return notify('This CSV has no Event column — pick a "Fixed event for all rows" first', true);
    }
    if (type === 'participants' && replaceMaster &&
      !window.confirm('Replace the ENTIRE master participants list? Existing entries not in this CSV will be lost.')) return;
    setBusy(true);
    try {
      const body = await fetchJson('/api/admin/import', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ type, rows: mappedObjects, defaultEvent, mode: replaceMaster ? 'replace' : 'merge' }),
      });
      notify(`${body.message} from "${fileNameRef.current}"`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(IMPORT_TARGETS).map(([k, t]) => (
          <button key={k} className={`filter-pill ${type === k ? 'active' : ''}`}
            onClick={() => setType(k)} style={{ cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>
      <p className="admin-note">{target.hint}</p>

      {!parsed && (
        <label className="admin-dropzone">
          <input type="file" accept=".csv,.txt" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])} />
          <span style={{ fontSize: '2rem' }}>📄</span>
          <b>Choose a CSV file</b>
          <span className="admin-note">Headers are detected automatically — you can fix the mapping next</span>
        </label>
      )}

      {parsed && (
        <>
          <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="admin-badge">{fileNameRef.current}</span>
            <span className="admin-note">{parsed.rows.length} rows · {validCount} valid</span>
            {type === 'participants' ? (
              <button className={`filter-pill ${replaceMaster ? 'active admin-danger-active' : ''}`}
                onClick={() => {
                  if (!replaceMaster) {
                    if (window.confirm('Switch to REPLACE mode? The whole master list will be overwritten by this CSV.')) setReplaceMaster(true);
                  } else setReplaceMaster(false);
                }}
                style={{ cursor: 'pointer' }}>
                {replaceMaster ? 'Replace mode ON' : 'Merge mode'}
              </button>
            ) : (
              <select className="admin-input" style={{ maxWidth: 240 }} value={defaultEvent}
                onChange={(e) => setDefaultEvent(e.target.value)}>
                <option value="">Fixed event for all rows (optional)</option>
                {eventNames.map((n) => <option key={n}>{n}</option>)}
              </select>
            )}
            <button className="filter-pill" onClick={() => { setParsed(null); setMapping({}); setDefaultEvent(''); setReplaceMaster(false); }}>Choose Different File</button>
          </div>

          {/* Event tagging status */}
          {type !== 'participants' && (
            <div className="results-banner" style={{ marginBottom: 20 }}>
              {mapping.event != null
                ? `Event will be read from the mapped column (${parsed.headers[mapping.event] || 'column'}) — rows with unknown event names are skipped`
                : defaultEvent
                  ? `All ${validCount} rows will be tagged as "${defaultEvent}"`
                  : '⚠ No event column mapped and no fixed event chosen — Import is disabled until you pick one'}
            </div>
          )}
          {type === 'participants' && (
            <div className="results-banner" style={{ marginBottom: 20 }}>
              {replaceMaster
                ? `⚠ REPLACE MODE — the entire master list will be replaced by these ${validCount} rows`
                : `Merge mode — new participants added, existing ones kept (${validCount} new row(s) detected)`}
            </div>
          )}

          {/* Column mapping */}
          <div className="admin-form-grid" style={{ marginBottom: 20 }}>
            {target.fields.map((f) => (
              <label key={f.key} className="admin-field">
                <span>{f.label}{f.required ? ' *' : ''}</span>
                <select className="admin-input"
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                >
                  <option value="">— Not mapped —</option>
                  {parsed.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>

          {/* Preview */}
          <h4 className="admin-section-title">PREVIEW (first 5 of {validCount})</h4>
          <table className="admin-table">
            <thead><tr>{target.fields.map((f) => <th key={f.key}>{f.label}</th>)}</tr></thead>
            <tbody>
              {mappedObjects.slice(0, 5).map((o, i) => (
                <tr key={i}>
                  {target.fields.map((f) => (
                    <td key={f.key} style={!f.required && !o[f.key] ? { color: '#555' } : undefined}>
                      {o[f.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-actions">
            <button className="btn-primary admin-btn" onClick={doImport} disabled={busy || validCount === 0}>
              {busy ? 'Importing...' : `Import ${validCount} Row(s)`}
            </button>
            <span className="admin-note">Site rebuilds automatically after import</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Check-In Desk ---------------- */
const personKey = (name, college) => `${normHeader(name)}|${normHeader(college)}`;

function CheckInLocal({ notify }) {
  const data = useApiData();
  const eventNames = useMemo(() => data?.events?.map((e) => e.name) || [], [data]);
  const colleges = useMemo(() => data?.participants?.colleges?.map((c) => c.name) || [], [data]);

  const [reg, setReg] = useState(null); // { registrations, attendance }
  const [event, setEvent] = useState('');
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const load = useCallback(() => {
    fetchJson('/api/admin/registrations', { headers: apiHeaders() })
      .then(setReg)
      .catch((e) => notify(e.message, true));
  }, [notify]);
  useEffect(load, [load]);

  // Flatten team rows into unique people
  const people = useMemo(() => {
    if (!reg) return [];
    const byKey = new Map();
    for (const r of reg.registrations) {
      const all = [{ name: r.lead, phone: r.phone }, ...r.members].filter((m) => m.name);
      for (const m of all) {
        const k = personKey(m.name, r.college || r.collegeRaw);
        if (byKey.has(k)) byKey.get(k).events.push(...r.events);
        else byKey.set(k, {
          key: k,
          name: m.name,
          phone: m.phone || '',
          college: r.college || r.collegeRaw,
          events: [...r.events],
          verified: r.verified,
          source: r.source,
        });
      }
    }
    return [...byKey.values()];
  }, [reg]);

  const attendance = useMemo(() => reg?.attendance || {}, [reg]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const qDigits = q.replace(/\D/g, '');
    return people
      .filter((p) => {
        if (event && !p.events.includes(event)) return false;
        return p.name.toLowerCase().includes(q) ||
          (qDigits.length >= 4 && p.phone.replace(/\D/g, '').includes(qDigits));
      })
      .slice(0, 12);
  }, [people, query, event]);

  const exactFound = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 3) return true;
    return matches.some((p) => p.name.toLowerCase() === q);
  }, [matches, query]);

  const togglePresent = async (p) => {
    const now = !attendance[p.key];
    // optimistic
    setReg((prev) => {
      const att = { ...(prev.attendance || {}) };
      if (now) att[p.key] = { present: true, at: new Date().toISOString() };
      else delete att[p.key];
      return { ...prev, attendance: att };
    });
    try {
      await fetchJson('/api/admin/attendance', {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ key: p.key, present: now }),
      });
      notify(now ? `${p.name} checked IN` : `${p.name} check-in undone`);
    } catch (err) {
      notify(err.message, true);
      load();
    }
  };

  // ---- Inline on-spot add when not found ----
  const [addForm, setAddForm] = useState(null); // {name, college, phone, paid}
  const [addEvents, setAddEvents] = useState([]);
  const addBusy = useRef(false);

  useEffect(() => {
    const q = query.trim();
    const trigger = q.length >= 3 && !exactFound && matches.length === 0;
    if (trigger && !addForm) {
      setAddForm({ name: q, college: '', phone: '', paid: false });
      setAddEvents(event ? [event] : []); // pre-select the desk's event
    } else if ((!trigger || exactFound) && addForm) {
      setAddForm(null);
      setAddEvents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute on query/matches change
  }, [query, exactFound, matches.length === 0]);

  const submitOnspot = async () => {
    if (addBusy.current || !addForm) return;
    if (!addForm.name.trim()) return notify('Name required', true);
    if (!addEvents.length) return notify('Select at least one event', true);
    addBusy.current = true;
    try {
      const body = await fetchJson('/api/admin/onspot', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          ...addForm,
          events: addEvents,
          members: [],
        }),
      });
      notify(`${body.message} — they can now be searched and checked in`);
      setAddForm(null);
      setAddEvents([]);
      load();
    } catch (err) {
      notify(err.message, true);
    } finally {
      addBusy.current = false;
    }
  };

  const presentCount = useMemo(
    () => people.filter((p) => attendance[p.key]).length,
    [people, attendance]
  );
  const presentInEvent = useMemo(() => {
    if (!event) return null;
    return people.filter((p) => p.events.includes(event) && attendance[p.key]).length;
  }, [people, event, attendance]);
  const registeredInEvent = useMemo(() => (
    event ? people.filter((p) => p.events.includes(event)).length : null
  ), [people, event]);

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="admin-input" style={{ maxWidth: 280 }} value={event}
          onChange={(e) => setEvent(e.target.value)}>
          <option value="">All events</option>
          {eventNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        <input
          ref={searchRef}
          className="admin-input"
          style={{ maxWidth: 360 }}
          placeholder="Search student by name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {registeredInEvent != null && (
          <span className="admin-badge">{presentInEvent}/{registeredInEvent} in {event}</span>
        )}
        <span className="admin-badge ok">{presentCount} checked in total</span>
      </div>

      {/* Search results */}
      {matches.map((p) => {
        const isPresent = Boolean(attendance[p.key]);
        const time = isPresent && attendance[p.key].at
          ? new Date(attendance[p.key].at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';
        const btnLabel = isPresent ? (time ? `\u2713 In (${time})` : '\u2713 In') : 'Mark Present';
        return (
          <div key={p.key} className={`checkin-hit ${isPresent ? 'in' : ''}`}>
            <div className="checkin-info">
              <b>{p.name}</b>
              <span>{p.college}</span>
              <span style={{ color: '#666' }}>{p.phone || 'no phone'} · {p.events.join(', ')}</span>
            </div>
            <button
              className={`admin-mini-btn ${isPresent ? 'verified-on' : ''}`}
              onClick={() => togglePresent(p)}
              title={isPresent ? 'Undo check-in' : 'Mark present'}
            >
              {btnLabel}
            </button>
          </div>
        );
      })}

      {query.trim().length >= 2 && matches.length === 0 && (
        <div className="results-banner" style={{ textAlign: 'left' }}>
          No match for "{query}"{event ? ` in ${event}` : ''}.
          {addForm ? ' Add them as on-spot below:' : ''}
        </div>
      )}

      {/* Inline on-spot registration */}
      {query.trim().length >= 3 && !exactFound && matches.length === 0 && addForm && (
        <div className="admin-card" style={{ maxWidth: 720 }}>
          <h4 className="admin-section-title" style={{ marginTop: 0 }}>QUICK ON-SPOT ADD</h4>
          <div className="admin-form-grid">
            <label className="admin-field"><span>Name *</span>
              <input className="admin-input" value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </label>
            <label className="admin-field"><span>Phone</span>
              <input className="admin-input" value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            </label>
            <label className="admin-field"><span>College</span>
              <input className="admin-input" list="checkin-colleges" value={addForm.college}
                onChange={(e) => setAddForm({ ...addForm, college: e.target.value })} />
              <datalist id="checkin-colleges">{colleges.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="admin-field"><span>Payment</span>
              <button type="button" className={`filter-pill ${addForm.paid ? 'active' : ''}`}
                onClick={() => setAddForm({ ...addForm, paid: !addForm.paid })}>
                {addForm.paid ? 'Paid ✓' : 'Unpaid'}
              </button>
            </label>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <span>Events * {event && `(pre-selected: ${event})`}</span>
              <div className="filter-pills" style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
                {eventNames.map((n) => (
                  <button key={n} type="button"
                    className={`filter-pill ${addEvents.includes(n) ? 'active' : ''}`}
                    onClick={() => setAddEvents((evs) =>
                      evs.includes(n) ? evs.filter((x) => x !== n) : [...evs, n]
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn-primary admin-btn" onClick={submitOnspot}>Add & Register On-Spot</button>
            <button className="filter-pill" onClick={() => setAddForm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Check-In (Cloud / Vercel mode) ---------------- */
const PENDING_KEY = 'cv_att_pending';

function loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || {}; }
  catch { return {}; }
}

function CheckInRemote({ notify }) {
  const [event, setEvent] = useState('');
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const [att, setAtt] = useState({});        // committed on GitHub
  const [pending, setPending] = useState(loadPending()); // unsynced toggles
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const extraPeople = useRef([]);            // quick-added this session

  useEffect(() => {
    ghGetFile(GH_ATTENDANCE_PATH)
      .then((j) => {
        if (j?.content) {
          try { setAtt(JSON.parse(j.content)); } catch {}
        }
      })
      .catch((e) => notify(e.message, true))
      .finally(() => setLoaded(true));
  }, [notify]);

  const people = useMemo(() => {
    const list = [...CHECKIN_DATA.people, ...extraPeople.current];
    return list.map((p) => ({ ...p, key: p.key || personKey(p.name, p.college), phone: '' }));
  }, []);

  const eventNames = useMemo(() => {
    const s = new Set();
    for (const p of people) for (const e of p.events) s.add(e);
    return [...s].sort();
  }, [people]);

  const attendanceOf = (key) => pending[key] ?? att[key];

  const togglePresent = async (p) => {
    const now = !attendanceOf(p.key);
    setPending((prev) => {
      const next = { ...prev };
      if (now) next[p.key] = { present: true, at: new Date().toISOString() };
      else delete next[p.key];
      localStorage.setItem(PENDING_KEY, JSON.stringify(next));
      return next;
    });
  };

  const pendingCount = Object.keys(pending).length;
  const presentCount = useMemo(
    () => people.filter((p) => (pending[p.key] ?? att[p.key])).length,
    [people, pending, att]
  );
  const registeredInEvent = event ? people.filter((p) => p.events.includes(event)).length : null;
  const presentInEvent = event
    ? people.filter((p) => p.events.includes(event) && attendanceOf(p.key)).length
    : null;

  const sync = async () => {
    if (!pendingCount) return;
    setSyncing(true);
    try {
      const merged = { ...att, ...pending };
      await ghPutFile(
        GH_ATTENDANCE_PATH,
        JSON.stringify(merged, null, 2),
        `admin: check-in sync (${pendingCount} update${pendingCount === 1 ? '' : 's'})`
      );
      setAtt(merged);
      setPending({});
      localStorage.removeItem(PENDING_KEY);
      notify(`Synced ${pendingCount} check-in(s) to GitHub ✓`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSyncing(false);
    }
  };

  // ---- Quick on-spot add (public-safe: no contact fields) ----
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const qDigits = q.replace(/\D/g, '');
    return people
      .filter((p) => {
        if (event && !p.events.includes(event)) return false;
        return p.name.toLowerCase().includes(q) ||
          (qDigits.length >= 4 && (p.phone || '').includes(qDigits));
      })
      .slice(0, 12);
  }, [people, query, event]);

  const exactFound = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 3 || matches.some((p) => p.name.toLowerCase() === q);
  }, [matches, query]);

  const [addForm, setAddForm] = useState(null);
  const [addEvents, setAddEvents] = useState([]);
  const addBusy = useRef(false);

  useEffect(() => {
    const q = query.trim();
    const trigger = q.length >= 3 && !exactFound && matches.length === 0;
    if (trigger && !addForm) {
      setAddForm({ name: q, college: '', paid: false });
      setAddEvents(event ? [event] : []);
    } else if ((!trigger || exactFound) && addForm) {
      setAddForm(null);
      setAddEvents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute on query/matches change
  }, [query, exactFound, matches.length === 0]);

  const colleges = useMemo(() => [...new Set(people.map((p) => p.college))].sort(), [people]);

  const submitOnspot = async () => {
    if (addBusy.current || !addForm) return;
    if (!addForm.name.trim()) return notify('Name required', true);
    if (!addEvents.length) return notify('Select at least one event', true);
    addBusy.current = true;
    try {
      const j = await ghGetFile(GH_ONSPOT_PUBLIC_PATH);
      const list = j?.content ? JSON.parse(j.content) : [];
      const entry = {
        id: Date.now(),
        lead: addForm.name.trim(),
        college: addForm.college.trim(),
        events: addEvents,
        members: [],
        paid: addForm.paid,
        verified: false,
      };
      list.push(entry);
      await ghPutFile(
        GH_ONSPOT_PUBLIC_PATH,
        JSON.stringify(list, null, 2),
        `admin: on-spot add ${entry.lead}`
      );
      extraPeople.current.push({
        key: personKey(entry.lead, entry.college),
        name: entry.lead,
        college: entry.college,
        events: entry.events,
      });
      setAddForm(null);
      setAddEvents([]);
      notify(`${entry.lead} added as on-spot — committed to GitHub ✓`);
      setQuery(entry.lead); // make them searchable immediately
    } catch (err) {
      notify(err.message, true);
    } finally {
      addBusy.current = false;
    }
  };

  if (!loaded) return <div className="admin-loading">Loading roster from GitHub...</div>;

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="admin-input" style={{ maxWidth: 280 }} value={event}
          onChange={(e) => setEvent(e.target.value)}>
          <option value="">All events</option>
          {eventNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        <input ref={searchRef} className="admin-input" style={{ maxWidth: 340 }}
          placeholder="Search student by name..." value={query}
          onChange={(e) => setQuery(e.target.value)} />
        {registeredInEvent != null && (
          <span className="admin-badge">{presentInEvent}/{registeredInEvent} in {event}</span>
        )}
        <span className="admin-badge ok">{presentCount} checked in</span>
        <button
          className={`btn-primary admin-btn ${pendingCount ? '' : ''}`}
          onClick={sync}
          disabled={!pendingCount || syncing}
          style={{ opacity: pendingCount ? 1 : 0.45 }}
        >
          {syncing ? 'Syncing...' : `☁ Sync ${pendingCount || ''} ${pendingCount ? 'to GitHub' : '(all synced)'}`}
        </button>
      </div>
      {pendingCount > 0 && (
        <p className="admin-note">
          ⚠ {pendingCount} unsynced check-in(s) stored on this device — press Sync before leaving.
        </p>
      )}

      {matches.map((p) => {
        const a = attendanceOf(p.key);
        const isPresent = Boolean(a);
        const time = isPresent && a.at ? new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const btnLabel = isPresent ? (time ? `\u2713 In (${time})` : '\u2713 In') : 'Mark Present';
        return (
          <div key={p.key} className={`checkin-hit ${isPresent ? 'in' : ''}`}>
            <div className="checkin-info">
              <b>{p.name}</b>
              <span>{p.college}</span>
              <span style={{ color: '#666' }}>{p.events.join(', ')}</span>
            </div>
            <button className={`admin-mini-btn ${isPresent ? 'verified-on' : ''}`}
              onClick={() => togglePresent(p)}>
              {btnLabel}
            </button>
          </div>
        );
      })}

      {query.trim().length >= 2 && matches.length === 0 && (
        <div className="results-banner" style={{ textAlign: 'left' }}>
          No match for "{query}"{event ? ` in ${event}` : ''}.
          {addForm ? ' Add them as on-spot below:' : ''}
        </div>
      )}

      {addForm && (
        <div className="admin-card" style={{ maxWidth: 720 }}>
          <h4 className="admin-section-title" style={{ marginTop: 0 }}>QUICK ON-SPOT ADD</h4>
          <p className="admin-note">On Vercel, entries are public-safe: name, college and events only.</p>
          <div className="admin-form-grid">
            <label className="admin-field"><span>Name *</span>
              <input className="admin-input" value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </label>
            <label className="admin-field"><span>College</span>
              <input className="admin-input" list="checkin-colleges-r" value={addForm.college}
                onChange={(e) => setAddForm({ ...addForm, college: e.target.value })} />
              <datalist id="checkin-colleges-r">{colleges.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="admin-field"><span>Payment</span>
              <button type="button" className={`filter-pill ${addForm.paid ? 'active' : ''}`}
                onClick={() => setAddForm({ ...addForm, paid: !addForm.paid })}>
                {addForm.paid ? 'Paid ✓' : 'Unpaid'}
              </button>
            </label>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <span>Events *</span>
              <div className="filter-pills" style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
                {eventNames.map((n) => (
                  <button key={n} type="button"
                    className={`filter-pill ${addEvents.includes(n) ? 'active' : ''}`}
                    onClick={() => setAddEvents((evs) =>
                      evs.includes(n) ? evs.filter((x) => x !== n) : [...evs, n]
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn-primary admin-btn" onClick={submitOnspot}>Add & Register On-Spot</button>
            <button className="filter-pill" onClick={() => setAddForm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckInPanel({ notify }) {
  const [mode, setMode] = useState(null); // null = detecting
  useEffect(() => { getApiMode().then(setMode); }, []);
  if (mode === 'remote') return <CheckInRemote notify={notify} />;
  if (mode === null) return <div className="admin-loading">Detecting environment...</div>;
  return <CheckInLocal notify={notify} />;
}

/* ---------------- Event Teams Roster ---------------- */
export function EventTeamsPanel({ notify }) {
  const data = useApiData();
  const eventNames = useMemo(() => data?.events?.map((e) => e.name) || [], [data]);

  const [rosters, setRosters] = useState(null);
  const [event, setEvent] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!event) return;
    fetchJson('/api/admin/rosters', { headers: apiHeaders() })
      .then(setRosters)
      .catch((e) => notify(e.message, true));
  }, [event, notify]);

  const teams = useMemo(() => {
    if (!rosters || !event) return [];
    const q = search.trim().toLowerCase();
    const list = rosters.events?.[event]?.teams || [];
    if (!q) return list;
    return list.filter((t) =>
      t.lead.toLowerCase().includes(q) ||
      (t.college || '').toLowerCase().includes(q) ||
      t.members.some((m) => m.name.toLowerCase().includes(q)) ||
      t.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  }, [rosters, event, search]);

  return (
    <div>
      <div className="admin-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="admin-input" style={{ maxWidth: 300 }} value={event}
          onChange={(e) => { setEvent(e.target.value); setRosters(null); }}>
          <option value="">— Select event —</option>
          {eventNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        {event && (
          <input className="admin-input" style={{ maxWidth: 320 }} placeholder="Search lead, member, college or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        )}
        {event && rosters && (
          <span className="admin-badge">{teams.length} team{teams.length === 1 ? '' : 's'}</span>
        )}
      </div>

      {!event && <div className="results-banner">Select an event to view its team roster — the form filler shows as LEAD.</div>}
      {event && !rosters && <div className="admin-loading">Loading roster...</div>}

      {event && rosters && teams.length === 0 && (
        <div className="results-banner">No teams found{search ? ` matching "${search}"` : ''}.</div>
      )}

      <div className="roster-grid">
        {teams.map((t, i) => (
          <div key={i} className="roster-card">
            <div className="roster-lead">
              <span className="roster-lead-badge">LEAD</span>
              <b>{t.lead}</b>
              <a href={`tel:${t.phone}`} className="roster-phone">{t.phone}</a>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#888', margin: '6px 0 10px' }}>{t.college}</div>
            {t.members.length > 0 && (
              <>
                <div className="roster-members-label">MEMBERS ({t.members.length})</div>
                <ul className="roster-members">
                  {t.members.map((m, j) => (
                    <li key={j}>
                      <span>{m.name}</span>
                      {m.phone && <a href={`tel:${m.phone}`} className="roster-phone">{m.phone}</a>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <span className={`admin-badge ${t.source === 'On-Spot' ? 'warn' : ''}`} style={{ marginTop: 8 }}>{t.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export function Dashboard({ goTo }) {
  const data = useApiData();
  const [regs, setRegs] = useState(null);
  const [apiMode, setApiMode] = useState(null);

  useEffect(() => {
    getApiMode().then(setApiMode);
  }, []);

  useEffect(() => {
    if (apiMode === 'remote') return; // no /api/admin on Vercel
    fetchJson('/api/admin/registrations', { headers: apiHeaders() })
      .then(setRegs)
      .catch(() => {});
  }, [apiMode]);

  if (!data) return <div className="admin-loading">Loading dashboard...</div>;

  const verified = regs ? regs.registrations.filter((r) => r.verified).length : null;
  const unpaid = regs ? regs.registrations.filter((r) => r.paid !== '1').length : null;
  const onspot = regs ? regs.registrations.filter((r) => r.source === 'On-Spot').length : null;
  const resultEvents = Object.values(data.leaderboard?.events || {}).filter((s) => s.length > 0).length;

  const cards = [
    { label: 'Registrations', value: regs?.count ?? (apiMode === 'remote' ? data.participants.totalRegistered : '—'), tab: apiMode === 'remote' ? null : 'registrations' },
    { label: 'Verified', value: verified ?? (apiMode === 'remote' ? '—' : '—'), tab: apiMode === 'remote' ? null : 'registrations', cls: 'ok' },
    { label: 'Unpaid', value: unpaid ?? (apiMode === 'remote' ? '—' : '—'), tab: apiMode === 'remote' ? null : 'registrations', cls: 'warn' },
    { label: 'On-Spot', value: onspot ?? (apiMode === 'remote' ? '—' : '—'), tab: apiMode === 'remote' ? null : 'onspot', cls: 'warn' },
    { label: 'Participants', value: data.participants.totalRegistered, tab: null },
    { label: 'Colleges', value: data.participants.colleges.length, tab: null },
    { label: 'Teams', value: data.participants.totalTeams, tab: null },
    { label: 'Results Declared', value: `${resultEvents}/8`, tab: 'scores' },
  ];

  return (
    <div>
      <div className="stat-cards big">
        {cards.map((c) => (
          <button key={c.label} className={`stat-card clickable ${c.cls || ''}`} onClick={() => c.tab && goTo(c.tab)}>
            <b>{c.value}</b><span>{c.label}</span>
          </button>
        ))}
      </div>
      {apiMode === 'remote' && (
        <p className="admin-note" style={{ color: '#C1121F' }}>
          ☁ Running in cloud mode — Registration details, On-Spot counts, and Verified/Unpaid stats
          require the laptop server (<code>npm start</code>). You can still use Check-In, Edit Events, and Enter Results via GitHub.
        </p>
      )}
      <p className="admin-note">
        Click a card to jump to its panel. Every save rebuilds the public site in ~2 seconds —
        just refresh the public page to see changes.
      </p>
    </div>
  );
}
