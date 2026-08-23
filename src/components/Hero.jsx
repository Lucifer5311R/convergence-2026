// ============================================================
// CONVERGENCE 2026 — Hero Section
// ============================================================

import { useMemo } from 'react';
import ParticleCanvas from './ParticleCanvas';
import { useCountdown } from '../hooks';
import { FEST_DATE } from '../data';

export default function Hero({ onRegisterClick, onExploreClick }) {
  const countdown = useCountdown(FEST_DATE);

  const letters = useMemo(() => {
    return 'CONVERGENCE'.split('').map((char, i) => ({
      char,
      delay: `${0.3 + i * 0.06}s`,
    }));
  }, []);

  return (
    <section className="hero" id="hero">
      <ParticleCanvas />
      
      {/* Mathematical Watermark Formulas */}
      <div className="math-watermark math-watermark-1">{"\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e"}</div>
      <div className="math-watermark math-watermark-2">{"e^{i\\pi} + 1 = 0"}</div>
      <div className="math-watermark math-watermark-3">{"\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}"}</div>
      <div className="math-watermark math-watermark-4">{"f(x) = \\sum_{n=-\\infty}^{\\infty} c_n e^{i n \\omega_0 x}"}</div>

      <div className="hero-content">
        <h1 className="hero-title">
          {letters.map((l, i) => (
            <span
              key={i}
              className="letter"
              style={{ animationDelay: l.delay }}
            >
              {l.char}
            </span>
          ))}
        </h1>

        <p className="hero-subtitle">Inter-Collegiate Mathematics Fest</p>

        <p className="hero-org">
          Department of Mathematics
          <br />
          CHRIST (Deemed to be University), Bengaluru
        </p>

        <p className="hero-tagline">
          "Converging Minds. Creating Possibilities."
        </p>

        <div className="hero-buttons">
          <button className="btn-primary" onClick={onRegisterClick}>
            Register Now
          </button>
          <button className="btn-secondary" onClick={onExploreClick}>
            Explore Events
          </button>
        </div>
      </div>

      <div className="countdown">
        {[
          { value: countdown.days, label: 'Days' },
          { value: countdown.hours, label: 'Hours' },
          { value: countdown.minutes, label: 'Min' },
          { value: countdown.seconds, label: 'Sec' },
        ].map((item) => (
          <div key={item.label} className="countdown-item">
            <div className="countdown-value">
              {String(item.value).padStart(2, '0')}
            </div>
            <span className="countdown-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
