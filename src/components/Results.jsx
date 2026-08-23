// ============================================================
// CONVERGENCE 2026 — Results Screen (#/results)
// Overall championship + event-wise winners, animated reveal.
// Real data: src/data/generated/leaderboard.json
// Until results are declared, shows a locked "revealing" state.
// ============================================================

import { useMemo } from 'react';
import { LEADERBOARD, EVENTS } from '../data';
import { useRevealOnScroll, useCounter } from '../hooks';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABEL = ['1st', '2nd', '3rd'];
const GLYPHS = ['∑', 'π', '∞', '√', 'Δ', 'θ', '∫', 'φ'];

function useResolvedData() {
  return useMemo(() => {
    const hasPoints = LEADERBOARD.colleges.some((c) => c.points > 0);
    return {
      hasPoints,
      colleges: LEADERBOARD.colleges,
      events: LEADERBOARD.events || {},
      declaredCount: Object.values(LEADERBOARD.events || {}).filter((s) => s.length > 0).length,
    };
  }, []);
}

/* ---------------- Championship podium ---------------- */
function Points({ value }) {
  const [count] = useCounter(value || 0, 1600, false);
  return <>{count}</>;
}

function Championship({ visible, data }) {
  const top3 = data.colleges.slice(0, 3);

  if (!data.hasPoints) {
    return (
      <div className="champ-zone">
        <div className="section-label" style={{ textAlign: 'center' }}>Championship</div>
        <h3 className="champ-title">OVERALL STANDINGS</h3>
        <div className="results-lock">
          <span className="lock-icon">🔒</span>
          The championship podium unlocks as finals conclude.
        </div>
        <div className={`champ-podium ${visible ? 'live' : ''}`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`champ-card skel ${i === 1 ? 'first' : ''}`} style={{ '--d': `${i * 120}ms` }}>
              <div className="skel-shimmer">?</div>
              <div className="champ-name">— — —</div>
              <div className="champ-pts">···</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="champ-zone">
      <div className="section-label" style={{ textAlign: 'center' }}>Championship</div>
      <h3 className="champ-title">OVERALL STANDINGS</h3>

      <div className={`champ-podium ${visible ? 'live' : ''}`}>
        {[1, 0, 2].map((pos) => {
          const c = top3[pos];
          if (!c) {
            return (
              <div key={pos} className={`champ-card empty ${pos === 0 ? 'first' : ''}`}>
                <div className="champ-rank">{RANK_LABEL[pos]}</div>
                <div className="champ-name">TBD</div>
              </div>
            );
          }
          return (
            <div
              key={pos}
              className={`champ-card pos${pos} ${pos === 0 ? 'first' : ''}`}
              style={{ '--d': `${pos === 0 ? 0 : 150}ms`, borderColor: MEDAL_COLORS[pos] }}
            >
              {pos === 0 && <div className="crown">🏆</div>}
              <div className="champ-rank" style={{ color: MEDAL_COLORS[pos] }}>{RANK_LABEL[pos]}</div>
              <div className="champ-name">{c.name}</div>
              <div className="champ-pts" style={{ color: MEDAL_COLORS[pos] }}>
                <Points value={c.points} />
                <small> pts</small>
              </div>
              <div className="champ-meta">{c.wins} win{c.wins === 1 ? '' : 's'} · {c.teams} teams</div>
            </div>
          );
        })}
      </div>

      <table className="leaderboard-table res-table">
        <thead>
          <tr><th>Rank</th><th>College</th><th>Wins</th><th>Teams</th><th>Participants</th><th>Points</th></tr>
        </thead>
        <tbody>
          {data.colleges.map((c, i) => (
            <tr key={c.name} className={`standings-row ${visible ? 'live' : ''}`} style={{ '--i': i }}>
              <td>
                <span className={`leaderboard-rank ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </td>
              <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.05rem', letterSpacing: 1 }}>{c.name}</td>
              <td>{c.wins || '—'}</td>
              <td>{c.teams}</td>
              <td>{c.participants}</td>
              <td style={{ fontFamily: "'Bebas Neue'", fontSize: '1.25rem', color: c.points ? '#C1121F' : '#555' }}>
                {c.points || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Event cards ---------------- */
function RankBadge({ rank, delayBase }) {
  return (
    <span
      className="res-medal"
      style={{
        borderColor: MEDAL_COLORS[rank - 1],
        color: MEDAL_COLORS[rank - 1],
        animationDelay: `${delayBase + rank * 140}ms`,
      }}
    >
      {RANK_LABEL[rank - 1]}
    </span>
  );
}

function EventCards({ visible, data }) {
  const cards = EVENTS.map((ev) => ({
    name: ev.name,
    number: ev.number,
    standings: data.events?.[ev.name] || [],
  }));

  return (
    <div className="event-results-zone">
      <div className="section-label" style={{ textAlign: 'center', marginTop: 56 }}>Event Wise</div>
      <h3 className="champ-title">EVENT RESULTS</h3>

      <div className={`event-res-grid ${visible ? 'live' : ''}`}>
        {cards.map((card, i) => {
          const declared = card.standings.length > 0;
          return (
            <div key={card.name}
              className={`event-res-card ${declared ? 'declared' : 'awaiting'} ${visible ? 'live' : ''}`}
              style={{ '--i': i }}>
              <div className="erc-head">
                <span className="erc-number">{card.number}</span>
                <span className="erc-name">{card.name}</span>
                <span className={`erc-status ${declared ? 'ok' : ''}`}>{declared ? 'DECLARED' : 'SOON'}</span>
              </div>
              {declared ? (
                <ul className="erc-winners">
                  {card.standings.slice(0, 3).map((row) => (
                    <li key={`${row.team}-${row.rank}`}>
                      <RankBadge rank={row.rank} delayBase={0} />
                      <span className="erc-team">{row.team}</span>
                      <span className="erc-college">{row.college}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="erc-awaiting">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <em>Awaiting finals</em>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Standalone screen ---------------- */
export default function Results() {
  const data = useResolvedData();
  const [ref, visible] = useRevealOnScroll(0.08);
  const title = 'RESULTS';

  return (
    <div className="event-detail-page section-dark results-screen">
      {/* floating math glyphs backdrop */}
      <div className="math-glyphs" aria-hidden="true">
        {GLYPHS.map((g, i) => (
          <span key={i} style={{ '--gi': i }}>{g}</span>
        ))}
      </div>

      <div className="event-detail-header-nav">
        <button className="back-btn" onClick={() => { window.location.hash = ''; }}>
          <span>←</span> Back to Festival
        </button>
        <span className="nav-logo">CONVERGENCE<span>2026</span></span>
      </div>

      <div className="results-stage-wrap">
        <div className="section-label" style={{ textAlign: 'center' }}>Live from the Arena</div>
        <div className="participants-title res-hero-title" aria-label={title}>
          {title.split('').map((ch, i) => (
            <span key={i} className={`title-letter ${visible ? 'live' : ''}`} style={{ '--ti': i }}>
              {ch}
            </span>
          ))}
        </div>

        <div className="results-banner" style={{ maxWidth: 720, marginBottom: 8 }}>
          {data.hasPoints
            ? <>Official results · updated after every final · {data.declaredCount}/8 events declared.</>
            : <>🔒 Results will be revealed right here — live, event by event, as finals conclude.</>}
        </div>

        <div ref={ref} className={`results-stage ${visible ? 'live' : ''}`}>
          <Championship visible={visible} data={data} />
          <EventCards visible={visible} data={data} />
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button className="btn-primary" onClick={() => { window.location.hash = ''; }}
            style={{ background: 'transparent', border: '1px solid #C1121F', padding: '12px 28px', letterSpacing: 2 }}>
            ← BACK TO FESTIVAL
          </button>
        </div>
      </div>
    </div>
  );
}
