import { useRevealOnScroll } from '../hooks';

export default function HowItWorks() {
  const [headerRef, headerVisible] = useRevealOnScroll(0.15);

  const steps = [
    {
      step: '01',
      title: 'Select Challenges',
      desc: 'Browse our diverse events grid. Filter by strategy, code, games, or core math to find what matches your skill set.',
    },
    {
      step: '02',
      title: 'Submit Registration',
      desc: 'Fill out the digital registration portal. Coordinate with your team members and apply discount promo codes.',
    },
    {
      step: '03',
      title: 'Compete & Win',
      desc: 'Show up on campus on February 15, pitch your formulas, solve puzzles in real time, and claim the cash prizes.',
    },
  ];

  return (
    <section className="section how-it-works-section" id="how-it-works">
      <div
        ref={headerRef}
        className={`how-it-works-header reveal-mask ${headerVisible ? 'visible' : ''}`}
      >
        <span className="section-label">Outreach & Guide</span>
        <h2 className="how-it-works-title">REGISTRATION FLOW</h2>
        <div className="math-divider">
          <span className="math-divider-line" />
          <span className="math-divider-label">{"x \\in [0, \\infty)"}</span>
          <span className="math-divider-line" />
        </div>
      </div>

      <div className="steps-container">
        {steps.map((s, idx) => (
          <div key={idx} className="step-card">
            <span className="step-num">{s.step}</span>
            <h3 className="step-card-title">{s.title}</h3>
            <p className="step-card-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
