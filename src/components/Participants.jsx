// ============================================================
// CONVERGENCE 2026 — Participants & Leaderboard
// ============================================================

import { useState, useMemo } from 'react';
import { PARTICIPANT_DATA, EVENTS } from '../data';
import { useRevealOnScroll } from '../hooks';
import { CollegeLeaderboard, EventStandings } from './Leaderboard';

const PAGE_SIZE = 48;

function ParticipantsList() {
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Flat list of unique people across events (name + college only — no contact info)
  const merged = useMemo(() => {
    const byKey = new Map();
    for (const [eventName, members] of Object.entries(PARTICIPANT_DATA.events)) {
      for (const m of members) {
        const key = `${m.key}|${m.college}`;
        if (byKey.has(key)) byKey.get(key).events.push(eventName);
        else byKey.set(key, { name: m.name, college: m.college, key, events: [eventName] });
      }
    }
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const collegeNames = useMemo(
    () => PARTICIPANT_DATA.colleges.map((c) => c.name),
    []
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return merged.filter((p) => {
      const matchesSearch = s === '' || p.name.toLowerCase().includes(s);
      const matchesCollege = collegeFilter === 'all' || p.college === collegeFilter;
      const matchesEvent = eventFilter === 'all' || p.events.includes(eventFilter);
      return matchesSearch && matchesCollege && matchesEvent;
    });
  }, [merged, search, collegeFilter, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const current = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = () => setPage(1);

  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search participants by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
        />
      </div>

      <div className="filter-pills">
        <select
          className="filter-pill"
          value={collegeFilter}
          onChange={(e) => { setCollegeFilter(e.target.value); resetPage(); }}
          style={{ cursor: 'pointer' }}
        >
          <option value="all">All Colleges</option>
          {collegeNames.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="filter-pill"
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); resetPage(); }}
          style={{ cursor: 'pointer' }}
        >
          <option value="all">All Events</option>
          {EVENTS.map((e) => (
            <option key={e.id} value={e.name}>{e.name}</option>
          ))}
        </select>
        <span style={{
          fontFamily: "'Space Grotesk'",
          fontSize: '0.75rem',
          color: '#888',
          alignSelf: 'center',
          letterSpacing: 1,
        }}>
          {filtered.length} participant{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="participants-list">
        {current.map((p) => (
          <div key={p.key} className="participant-row">
            <div className="participant-name">{p.name}</div>
            <div className="participant-college">{p.college}</div>
            <div className="participant-events">{p.events.join(' · ')}</div>
          </div>
        ))}
        {current.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: 48,
            color: '#777',
            fontFamily: "'Space Grotesk'",
            fontSize: '0.85rem',
          }}>
            No participants found matching your criteria.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button
            className="filter-pill"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            style={{ opacity: safePage <= 1 ? 0.4 : 1, cursor: 'pointer' }}
          >
            ← Prev
          </button>
          <span style={{
            fontFamily: "'Bebas Neue'",
            fontSize: '1.1rem',
            letterSpacing: 2,
            color: '#aaa',
            alignSelf: 'center',
          }}>
            {safePage} / {totalPages}
          </span>
          <button
            className="filter-pill"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            style={{ opacity: safePage >= totalPages ? 0.4 : 1, cursor: 'pointer' }}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default function Participants() {
  const [activeTab, setActiveTab] = useState('colleges');
  const [headerRef, headerVisible] = useRevealOnScroll();

  return (
    <section className="section" id="participants">
      <div
        ref={headerRef}
        className={`participants-header reveal ${headerVisible ? 'visible' : ''}`}
      >
        <div className="section-label">Live Dashboard</div>
        <div className="participants-title">LEADERBOARD</div>
      </div>

      <div className="participant-tabs">
        <button
          className={`participant-tab ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          Top Colleges
        </button>
        <button
          className={`participant-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Event Standings
        </button>
        <button
          className={`participant-tab ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          Participants
        </button>
      </div>

      {activeTab === 'colleges' && <CollegeLeaderboard />}
      {activeTab === 'events' && <EventStandings />}
      {activeTab === 'participants' && <ParticipantsList />}
    </section>
  );
}
