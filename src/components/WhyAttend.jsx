import { useRevealOnScroll } from '../hooks';

export default function WhyAttend() {
  const [headerRef, headerVisible] = useRevealOnScroll(0.15);

  const values = [
    {
      title: '₹1,00,000+ Rewards',
      desc: 'Compete for substantial cash prizes, premium trophies, and elite national certificates of achievement.',
      svg: (
        <svg viewBox="0 0 100 100" className="value-svg">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M35 50 L45 60 L65 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Interdisciplinary Logic',
      desc: 'Perfect for Computer Science, Physics, Economics, and Business majors. Test strategy, game theory, and cryptography.',
      svg: (
        <svg viewBox="0 0 100 100" className="value-svg">
          <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" strokeWidth="1" />
          <line x1="25" y1="75" x2="75" y2="25" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: '500+ National Peers',
      desc: 'Connect and collaborate with the brightest logical minds representing 50+ elite colleges across the country.',
      svg: (
        <svg viewBox="0 0 100 100" className="value-svg">
          <circle cx="35" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="65" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 75 Q35 60 50 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M50 75 Q65 60 80 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: 'Expert Spotlights',
      desc: 'Present your mathematical research and innovation (Project Infinity) directly to leading university professors.',
      svg: (
        <svg viewBox="0 0 100 100" className="value-svg">
          <path d="M20 70 L40 40 L60 55 L80 25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="section section-dark why-attend-section" id="why-attend">
      {/* Decorative Blueprint Line grid */}
      <div className="swiss-grid-lines">
        <div className="grid-vertical-line" />
        <div className="grid-horizontal-line" />
      </div>

      <div
        ref={headerRef}
        className={`why-attend-header reveal-mask ${headerVisible ? 'visible' : ''}`}
      >
        <span className="section-label">Why Join?</span>
        <h2 className="why-attend-title">FEST VALUES & ADVANTAGES</h2>
        <div className="math-divider">
          <span className="math-divider-line" />
          <span className="math-divider-label">{"f(x) = \\sum_{n=1}^{\\infty} a_n"}</span>
          <span className="math-divider-line" />
        </div>
      </div>

      <div className="values-grid">
        {values.map((v, i) => (
          <div key={i} className="value-card-trace">
            <div className="value-card">
              <div className="value-icon">{v.svg}</div>
              <h3 className="value-card-title">{v.title}</h3>
              <p className="value-card-desc">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
