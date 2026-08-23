// ============================================================
// CONVERGENCE 2026 — Last Year / Legacy Section
// ============================================================

import { useEffect } from 'react';
import { LAST_YEAR } from '../data';
import { useRevealOnScroll, useCounter } from '../hooks';

function LegacyStat({ value, suffix, label }) {
  const [ref, isVisible] = useRevealOnScroll(0.3);
  const [count, start] = useCounter(value, 2000, true);
  
  useEffect(() => {
    if (isVisible) {
      start();
    }
  }, [isVisible, start]);

  return (
    <div ref={ref} className="stat-item" style={{ textAlign: 'center' }}>
      <div className="legacy-stat-number">{count}{suffix}</div>
      <div className="legacy-stat-label">{label}</div>
    </div>
  );
}

export default function Legacy() {
  const [headerRef, headerVisible] = useRevealOnScroll();
  const [winnersRef, winnersVisible] = useRevealOnScroll();
  const [testimonialRef, testimonialVisible] = useRevealOnScroll();

  return (
    <section className="section section-dark" id="legacy">
      <div
        ref={headerRef}
        className={`reveal ${headerVisible ? 'visible' : ''}`}
      >
        <div className="legacy-title">THE LEGACY</div>
        <div className="legacy-subtitle">CONVERGENCE 2025 — A look back at what was built.</div>
      </div>

      <div className="legacy-stats">
        {LAST_YEAR.stats.map((s) => (
          <LegacyStat key={s.label} {...s} />
        ))}
      </div>

      {/* Event Recap Grid */}
      <div style={{ maxWidth: 1000, margin: '0 auto 48px' }}>
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 24 }}>
          Event Winners 2025
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {LAST_YEAR.eventRecap.map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 20px',
                transition: 'border-color 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(193,18,31,0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              <div style={{
                fontFamily: "'Bebas Neue'",
                fontSize: '1.1rem',
                letterSpacing: 2,
                color: '#C1121F',
                marginBottom: 4,
              }}>{item.event}</div>
              <div style={{ fontSize: '0.85rem', color: '#fff' }}>{item.winner}</div>
              <div style={{
                fontFamily: "'Space Grotesk'",
                fontSize: '0.65rem',
                color: '#aaa',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginTop: 2,
              }}>{item.college}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Aftermovie Showcase */}
      <div style={{ maxWidth: 450, margin: '0 auto 48px', padding: '0 20px', textAlign: 'center' }}>
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 16 }}>
          Official Festival Teaser
        </div>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '580px',
          background: '#0d0d15',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <iframe
            style={{
              width: '100%',
              height: '100%',
              border: 0,
            }}
            src="https://www.instagram.com/reel/Db_UuuHS6gr/embed/"
            title="Convergence Instagram Reel"
            allowtransparency="true"
            allow="encrypted-media"
            scrolling="no"
          />
        </div>
      </div>

      {/* Winner Spotlights */}
      <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>
        Top Teams — Overall Standings
      </div>
      <div
        ref={winnersRef}
        className={`winners-grid reveal ${winnersVisible ? 'visible' : ''}`}
      >
        {LAST_YEAR.winners.map((w) => (
          <div key={w.rank} className="winner-card">
            <div className={`winner-rank ${w.rankClass}`}>
              {w.rank === 1 ? 'I' : w.rank === 2 ? 'II' : 'III'}
            </div>
            <div className="winner-team">{w.team}</div>
            <div className="winner-college">{w.college}</div>
            <div className="winner-score">Score: {w.score}</div>
            <div style={{
              fontFamily: "'Space Grotesk'",
              fontSize: '0.65rem',
              color: '#777',
              marginTop: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Won: {w.eventsWon}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div
        ref={testimonialRef}
        className={`legacy-testimonial reveal ${testimonialVisible ? 'visible' : ''}`}
      >
        <div className="testimonial-quote">
          "{LAST_YEAR.testimonial.quote}"
        </div>
        <div className="testimonial-author">
          — {LAST_YEAR.testimonial.author}
        </div>
      </div>
    </section>
  );
}
