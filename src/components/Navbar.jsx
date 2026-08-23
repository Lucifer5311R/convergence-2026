// ============================================================
// CONVERGENCE 2026 — Navbar Component
// ============================================================

import { useState, useEffect } from 'react';
import { useScrollProgress } from '../hooks';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Events', href: '#events' },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Legacy', href: '#legacy' },
  { label: 'Teams', href: '#participants' },
  { label: 'Committee', href: '#committee' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar({ onRegisterClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false);
  const progress = useScrollProgress();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);

      // Check if we're over a dark section
      const darkSections = document.querySelectorAll('.section-dark');
      const navBottom = 72;
      let overDark = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < navBottom && rect.bottom > 0) {
          overDark = true;
        }
      });
      setIsDarkSection(overDark);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const offset = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isDarkSection ? 'dark-section' : ''}`}>
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          C<span>'</span>26
        </a>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="nav-link"
              onClick={(e) => handleNavClick(e, item.href)}
            >
              {item.label}
            </a>
          ))}
          <button className="nav-cta" onClick={onRegisterClick}>
            Register
          </button>
        </div>

        <div
          className={`menu-toggle ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span style={{ background: isDarkSection && !mobileOpen ? '#fff' : undefined }} />
          <span style={{ background: isDarkSection && !mobileOpen ? '#fff' : undefined }} />
          <span style={{ background: isDarkSection && !mobileOpen ? '#fff' : undefined }} />
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            className="nav-link"
            style={{
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.4s ease ${i * 0.05}s`,
            }}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            {item.label}
          </a>
        ))}
        <button
          className="nav-cta"
          style={{ marginTop: 16 }}
          onClick={() => { setMobileOpen(false); onRegisterClick(); }}
        >
          Register Now
        </button>
      </div>
    </>
  );
}
