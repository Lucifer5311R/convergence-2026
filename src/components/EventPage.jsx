import { useEffect } from 'react';
import { EVENTS } from '../data';

export default function EventPage({ eventId, onBack }) {
  const event = EVENTS.find((e) => e.id === Number(eventId));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [eventId]);

  if (!event) {
    return (
      <div className="event-error-page">
        <h2>Event not found</h2>
        <button className="btn-primary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="event-detail-page section-dark">
      <div className="event-detail-header-nav">
        <button className="back-btn" onClick={onBack}>
          <span>←</span> Back to Festival
        </button>
        <span className="nav-logo">CONVERGENCE<span>2026</span></span>
      </div>

      <div className="event-detail-container">
        {/* Left Side: Creative Poster & Visualization */}
        <div className="event-detail-visual">
          <div className={`event-poster-wrapper ${event.bgClass}`} style={{
            backgroundImage: event.posterUrl ? `url(${event.posterUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            {!event.posterUrl && (
              <>
                <div className="poster-grid-overlay" />
                <div className="event-poster-content">
                  <span className="poster-number">{event.number}</span>
                  <h1 className="poster-title">{event.name}</h1>
                  <p className="poster-quote">{event.quote}</p>
                </div>
                
                {/* Visual math theme decorations */}
                <div className="poster-math-decorations">
                  <span>f(x) = ∑<sub>n=1</sub><sup>∞</sup> a<sub>n</sub></span>
                  <span>∇ × B⃗ = ∂D/∂t</span>
                  <span>Φ ≈ 1.618</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Objective & Features */}
        <div className="event-detail-info">
          <div className="event-info-header">
            <span className="event-tags-pill">{event.tags}</span>
            <span className="event-difficulty-badge">{event.difficulty}</span>
            <h2 className="event-info-title">{event.name}</h2>
            {event.tagline && (
              <p style={{
                fontFamily: "'Space Grotesk'",
                fontSize: '0.9rem',
                color: '#C1121F',
                letterSpacing: '1px',
                marginTop: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>{event.tagline}</p>
            )}
          </div>

          <div className="event-info-section">
            <h3 className="section-label">Objective</h3>
            <p className="event-objective-text">{event.description}</p>
          </div>

          <div className="event-info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            <div className="feature-box">
              <span className="feature-label">Prize Pool</span>
              <span className="feature-val highlight-val">{event.prizes}</span>
            </div>
            <div className="feature-box">
              <span className="feature-label">Team Size</span>
              <span className="feature-val">{event.teamSize}</span>
            </div>
            <div className="feature-box">
              <span className="feature-label">Duration</span>
              <span className="feature-val">{event.duration}</span>
            </div>
            {event.dateTime && (
              <div className="feature-box">
                <span className="feature-label">Date & Time</span>
                <span className="feature-val" style={{ fontSize: '0.8rem' }}>{event.dateTime} {event.time ? `@ ${event.time}` : ''}</span>
              </div>
            )}
            {event.venue && (
              <div className="feature-box">
                <span className="feature-label">Venue</span>
                <span className="feature-val" style={{ fontSize: '0.8rem' }}>{event.venue}</span>
              </div>
            )}
          </div>

          <div className="event-info-section">
            <h3 className="section-label">Rules & Regulations</h3>
            <ul className="event-rules-list">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="rule-item">
                  <span className="rule-bullet">—</span>
                  <span className="rule-text">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {event.contacts && event.contacts.length > 0 && (
            <div className="event-info-section" style={{ marginTop: '24px' }}>
              <h3 className="section-label">Event Coordinators</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
                {event.contacts.map((contact, idx) => (
                  <div key={idx} style={{ background: '#0a0a0f', border: '1px solid #222', padding: '12px 16px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', fontFamily: "'Space Grotesk'" }}>{contact.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                      Phone: <a href={`tel:${contact.phone}`} style={{ color: '#C1121F', textDecoration: 'none' }}>{contact.phone}</a>
                    </div>
                    {contact.email && (
                      <div style={{ fontSize: '0.75rem', color: '#666', wordBreak: 'break-all', marginTop: '2px' }}>
                        Email: <a href={`mailto:${contact.email}`} style={{ color: '#aaa', textDecoration: 'none' }}>{contact.email}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="event-action-panel">
            <button className="btn-primary event-register-btn" onClick={() => window.location.hash = '#/register'}>
              Register for {event.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
