// ============================================================
// CONVERGENCE 2026 — Gallery Section
// ============================================================

import { useState, useMemo } from 'react';
import { GALLERY_ITEMS } from '../data';
import { useRevealOnScroll } from '../hooks';

export default function Gallery() {
  const [titleRef, titleVisible] = useRevealOnScroll();
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (filter === 'all') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.type === filter);
  }, [filter]);

  return (
    <section className="section" id="gallery">
      <div
        ref={titleRef}
        className={`reveal ${titleVisible ? 'visible' : ''}`}
      >
        <div className="section-label" style={{ textAlign: 'center' }}>Moments</div>
        <div className="gallery-title">GALLERY</div>
      </div>

      {/* Filter Menu */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        {[
          { key: 'all', label: 'All Media' },
          { key: 'poster', label: 'Posters' },
          { key: 'photo', label: 'Moments' },
          { key: 'video', label: 'Promo Videos' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            style={{
              background: filter === btn.key ? '#C1121F' : 'transparent',
              color: filter === btn.key ? '#fff' : '#aaa',
              border: filter === btn.key ? '1px solid #C1121F' : '1px solid #333',
              padding: '6px 14px',
              fontFamily: "'Space Grotesk'",
              fontSize: '0.8rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.3s'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="gallery-grid" style={{ transition: 'all 0.4s ease' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="gallery-item"
            onClick={() => setLightbox(item)}
          >
            {item.videoUrl ? (
              <video
                className="gallery-img"
                src={item.videoUrl}
                muted
                preload="metadata"
                style={{ height: 240, width: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />
            ) : (
              <img
                className="gallery-img"
                src={item.imgUrl}
                alt={item.title}
                loading="lazy"
                style={{ height: item.imgUrl && item.title.includes('Moment') ? 240 : 300, width: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Cinematic badge on card */}
            <span style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              fontSize: '0.6rem',
              fontFamily: "'Space Grotesk'",
              background: '#C1121F',
              color: '#fff',
              padding: '2px 8px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              borderRadius: '2px'
            }}>
              {item.type}
            </span>
            <div className="gallery-overlay">
              <span className="gallery-overlay-text">{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="modal-overlay open"
          onClick={() => setLightbox(null)}
        >
          <div
            style={{
              maxWidth: 800,
              width: '90%',
              background: '#0a0a0f',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setLightbox(null)}
              style={{ color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', zIndex: 2, position: 'absolute', top: 12, right: 12 }}
            >
              ✕
            </button>
            {lightbox.videoUrl ? (
              <video
                src={lightbox.videoUrl}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            ) : (
              <img
                src={lightbox.imgUrl}
                alt={lightbox.title}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
              />
            )}
            <div style={{
              marginTop: 12,
              marginBottom: 12,
              fontFamily: "'Space Grotesk'",
              fontSize: '0.85rem',
              letterSpacing: 2,
              color: '#fff',
              textTransform: 'uppercase',
            }}>
              {lightbox.title}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
