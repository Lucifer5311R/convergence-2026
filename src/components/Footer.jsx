import { useRevealOnScroll } from '../hooks';
import { CONTACT_INFO } from '../data';

export default function Footer() {
  const [ref, visible] = useRevealOnScroll();

  return (
    <footer className="footer" id="contact">
      <div
        ref={ref}
        className={`footer-content reveal ${visible ? 'visible' : ''}`}
      >
        <div>
          <div className="footer-title">GET IN TOUCH</div>
          <div className="footer-info">
            <div className="footer-info-item">
              <span className="footer-info-label">Email</span>
              <a href={`mailto:${CONTACT_INFO.email}`} className="footer-info-value">
                {CONTACT_INFO.email}
              </a>
            </div>
            <div className="footer-info-item">
              <span className="footer-info-label">Phone</span>
              <a href={CONTACT_INFO.phoneUrl} className="footer-info-value">
                {CONTACT_INFO.phone}
              </a>
            </div>
            <div className="footer-info-item">
              <span className="footer-info-label">Location</span>
              <span className="footer-info-value">
                {CONTACT_INFO.location}
              </span>
            </div>
            <div className="footer-info-item">
              <span className="footer-info-label">Instagram</span>
              <a href={CONTACT_INFO.instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-info-value">
                {CONTACT_INFO.instagram}
              </a>
            </div>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-wordmark">
            CONVERGENCE
          </div>
          <div className="footer-nav">
            {['About', 'Events', 'Schedule', 'Legacy', 'Teams', 'Committee', 'Gallery', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="footer-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  const target = item === 'Teams' ? 'participants' : item.toLowerCase();
                  const el = document.getElementById(target);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copyright">
          © 2026 CONVERGENCE. All rights reserved.
        </span>
        <span className="footer-org">
          Department of Mathematics · CHRIST (Deemed to be University)
        </span>
      </div>
    </footer>
  );
}
