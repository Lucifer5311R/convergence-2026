// ============================================================
// CONVERGENCE 2026 — Leaderboard Views
// Data comes from src/data/generated/*.json
// (regenerate with: npm run build-data)
// ============================================================

import { useState } from 'react';
import { PARTICIPANT_DATA, LEADERBOARD, EVENTS } from '../data';
import { useRevealOnScroll, useCounter } from '../hooks';

const MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS = ['1st', '2nd', '3rd'];

function AnimatedNumber({ value }) {
  const [count] = useCounter(value || 0, 1500, false);
  return <>{count}</>;
}

export function ResultsBanner({ children }) {
  return <div className="results-banner">{children}</div>;
}

function PodiumCard({ college, rank }) {
  const [ref, visible] = useRevealOnScroll();
  return (
    <div
      ref={ref}
      className={`team-card reveal ${visible ? 'visible' : ''}`}
      style={{
        borderColor: MEDALS[rank],
        borderWidth: 2,
        order: rank === 0 ? 1 : rank,
        transform: rank === 0 ? 'scale(1.05)' : undefined,
      }}
    >
      <div style={{
        fontFamily: "'Bebas Neue'",
        fontSize: '1rem',
        letterSpacing: 3,
        color: MEDALS[rank],
      }}>
        {MEDAL_ICONS[rank]}
      </div>
      <div className="team-name" style={{ minHeight: '2.4em' }}>{college.name}</div>
      <div className="team-score" style={{ color: MEDALS[rank] }}>
        <AnimatedNumber value={college.points} />
        <span style={{ fontSize: '0.9rem', color: '#777', fontFamily: "'Space Grotesk'" }}> pts</span>
      </div>
      <div className="team-meta">
        <span className="team-meta-item">{college.wins} win{college.wins === 1 ? '' : 's'}</span>
        <span className="team-meta-item">{college.teams} teams</span>
        <span className="team-meta-item">{college.participants} participants</span>
      </div>
    </div>
  );
}

export function CollegeLeaderboard() {
  const colleges = LEADERBOARD.colleges;
  const hasPoints = colleges.some((c) => c.points > 0);
  const podium = colleges.slice(0, 3);

  return (
    <>
      {!hasPoints && (
        <ResultsBanner>
          Results will be updated live during the fest — standings below show registrations so far.
        </ResultsBanner>
      )}

      <div className="podium-grid">
        {podium.map((c, i) => (
          <PodiumCard key={c.name} college={c} rank={i} />
        ))}
      </div>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>College</th>
            <th>Participants</th>
            <th>Teams</th>
            <th>Wins</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {colleges.map((c, i) => (
            <tr key={c.name}>
              <td>
                <span className={`leaderboard-rank ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </td>
              <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.05rem', letterSpacing: 1 }}>{c.name}</td>
              <td>{c.participants}</td>
              <td>{c.teams}</td>
              <td>{c.wins || '—'}</td>
              <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.3rem', color: c.points ? '#C1121F' : '#555' }}>
                {c.points || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function EventStandings() {
  const eventNames = EVENTS.map((e) => e.name);
  const [active, setActive] = useState(eventNames[0]);
  const [ref, visible] = useRevealOnScroll();

  const standings = (LEADERBOARD.events && LEADERBOARD.events[active]) || [];
  const registered = (PARTICIPANT_DATA.events && PARTICIPANT_DATA.events[active]) || [];

  return (
    <>
      <div className="filter-pills">
        {eventNames.map((name) => (
          <button
            key={name}
            className={`filter-pill ${active === name ? 'active' : ''}`}
            onClick={() => setActive(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div ref={ref} className={`reveal ${visible ? 'visible' : ''}`}>
        {standings.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>College</th>
                <th>Score</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={`${row.team}-${row.rank}`}>
                  <td>
                    <span className={`leaderboard-rank ${row.rank === 1 ? 'rank-gold' : row.rank === 2 ? 'rank-silver' : row.rank === 3 ? 'rank-bronze' : ''}`}>
                      {String(row.rank).padStart(2, '0')}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.05rem', letterSpacing: 1 }}>{row.team}</td>
                  <td style={{ fontSize: '0.85rem', color: '#777' }}>{row.college}</td>
                  <td>{row.value}</td>
                  <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.3rem', color: '#C1121F' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ResultsBanner>
            No results declared yet for {active}. Check back after the finals!
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#888' }}>
              {registered.length} participant{registered.length === 1 ? '' : 's'} registered for this event.
            </div>
          </ResultsBanner>
        )}
      </div>
    </>
  );
}
