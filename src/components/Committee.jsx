// ============================================================
// CONVERGENCE 2026 — Committee Section
// ============================================================

import { FACULTY, STUDENTS } from '../data';
import { useRevealOnScroll, useStaggerReveal } from '../hooks';

export default function Committee() {
  const [titleRef, titleVisible] = useRevealOnScroll();
  const facultyStagger = useStaggerReveal(FACULTY.length, 150);
  const studentStagger = useStaggerReveal(STUDENTS.length, 100);

  return (
    <section className="section" id="committee">
      <div
        ref={titleRef}
        className={`reveal ${titleVisible ? 'visible' : ''}`}
      >
        <div className="section-label" style={{ textAlign: 'center' }}>The People</div>
        <div className="committee-title">COMMITTEE</div>
      </div>

      <div className="committee-section-title">Faculty Coordinators</div>
      <div className="faculty-grid" ref={facultyStagger.ref}>
        {FACULTY.map((f, i) => (
          <div
            key={f.name}
            className={`faculty-card stagger-item ${facultyStagger.visibleItems.has(i) ? 'visible' : ''}`}
          >
            <div className="faculty-avatar">{f.initials}</div>
            <div className="faculty-name">{f.name}</div>
            <div className="faculty-role">{f.role}</div>
          </div>
        ))}
      </div>

      <div className="committee-section-title">Student Coordinators</div>
      <div className="student-grid" ref={studentStagger.ref}>
        {STUDENTS.map((s, i) => (
          <div
            key={s.name}
            className={`student-card stagger-item ${studentStagger.visibleItems.has(i) ? 'visible' : ''}`}
          >
            <div className="student-name">{s.name}</div>
            <div className="student-role">{s.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
