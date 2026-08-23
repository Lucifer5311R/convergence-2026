// ============================================================
// CONVERGENCE 2026 — Events Section (Cinematic Dark)
// ============================================================

import { useCallback, useRef } from 'react';
import { EVENTS } from '../data';
import { useRevealOnScroll } from '../hooks';

function EventCard({ event, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  }, []);

  return (
    <div
      ref={cardRef}
      className="event-card stagger-item visible"
      style={{ transitionDelay: `${index * 0.1}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => window.location.hash = `#/event/${event.id}`}
    >
      <div className={`event-card-bg ${event.bgClass}`} />
      <div className="event-number">{event.number}</div>
      <div className="event-name glitch-text">{event.name}</div>
      <div className="event-tags">{event.tags}</div>
      <div className="event-card-difficulty">{event.difficulty}</div>
      <div className="event-quote">{event.quote}</div>
      <div className="event-view-btn">
        View Details <span>→</span>
      </div>
    </div>
  );
}

export default function Events() {
  const [headerRef, headerVisible] = useRevealOnScroll();

  return (
    <section className="section section-dark" id="events">
      <div
        ref={headerRef}
        className={`events-header reveal ${headerVisible ? 'visible' : ''}`}
      >
        <div className="events-title">THE EVENTS</div>
        <div className="events-subtitle">Eight challenges. One battlefield.</div>
        <div className="events-divider" />
      </div>

      <div className="events-grid">
        {EVENTS.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
