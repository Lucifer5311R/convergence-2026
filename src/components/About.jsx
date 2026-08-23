// ============================================================
// CONVERGENCE 2026 — About Section
// ============================================================

import { useEffect } from 'react';
import { useRevealOnScroll, useCounter } from '../hooks';
import { ABOUT_STATS } from '../data';
import OutreachPuzzle from './OutreachPuzzle';

function StatItem({ value, suffix, label }) {
  const [ref, isVisible] = useRevealOnScroll(0.3);
  const [count, start] = useCounter(value, 2000, true);

  useEffect(() => {
    if (isVisible) {
      start();
    }
  }, [isVisible, start]);

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-number">
        {count}<span className="accent">{suffix}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function About() {
  const [titleRef, titleVisible] = useRevealOnScroll();
  const [textRef, textVisible] = useRevealOnScroll();

  return (
    <section className="section" id="about">
      <div className="about">
        <div
          ref={titleRef}
          className={`about-vertical-text reveal-left ${titleVisible ? 'visible' : ''}`}
        >
          ABOUT
        </div>
        <div className="about-content">
          <div className="section-label">The Convergence</div>
          <p
            ref={textRef}
            className={`about-text reveal ${textVisible ? 'visible' : ''}`}
          >
            <strong>CONVERGENCE</strong> is the flagship Inter-Collegiate
            Mathematics Fest organized by the Department of Mathematics at{' '}
            <strong>CHRIST (Deemed to be University), Bengaluru</strong>. A
            celebration of logic, strategy, creativity, and mathematical
            brilliance — bringing together the sharpest minds from institutions
            across the country. From high-stakes problem solving to cryptographic
            challenges and game theory battles, CONVERGENCE pushes the boundaries
            of what a mathematics competition can be.
          </p>
          <div className="stats-grid">
            {ABOUT_STATS.map((s) => (
              <StatItem key={s.label} {...s} />
            ))}
          </div>
          <OutreachPuzzle />
        </div>
      </div>

      {/* Golden spiral SVG - decorative */}
      <svg className="golden-spiral" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M250 250 C250 112 362 0 500 0 L500 250 C500 181 444 125 375 125 L375 250 C375 213 350 188 313 188 L313 250 C313 231 300 219 281 219 L281 250"
          stroke="#111"
          strokeWidth="1"
          opacity="0.15"
          fill="none"
        />
      </svg>
    </section>
  );
}
