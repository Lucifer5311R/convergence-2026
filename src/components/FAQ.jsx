// ============================================================
// CONVERGENCE 2026 — FAQ Section
// ============================================================

import { useState } from 'react';
import { FAQS } from '../data';
import { useRevealOnScroll } from '../hooks';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [titleRef, titleVisible] = useRevealOnScroll();

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section" id="faq">
      <div
        ref={titleRef}
        className={`reveal ${titleVisible ? 'visible' : ''}`}
      >
        <div className="section-label" style={{ textAlign: 'center' }}>Questions</div>
        <div className="faq-title">FAQ</div>
      </div>

      <div className="faq-list">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={`faq-item ${openIndex === i ? 'active' : ''}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleFaq(i)}
            >
              <span className="faq-index">[{String(i + 1).padStart(2, '0')}]</span>
              <span className="faq-question-text">{faq.question}</span>
              <span className={`faq-toggle ${openIndex === i ? 'open' : ''}`}>+</span>
            </button>
            <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>
              <p className="faq-answer-text">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
