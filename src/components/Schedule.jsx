// ============================================================
// CONVERGENCE 2026 — Schedule Section
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { SCHEDULE } from '../data';

function TimelineItem({ item, index, isActive }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 80);
          obs.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className={`timeline-item ${visible ? 'visible' : ''} ${isActive ? 'active' : ''}`}
    >
      <div className="timeline-time">{item.time}</div>
      <div className="timeline-event">{item.title}</div>
      <div className="timeline-desc">{item.desc}</div>
    </div>
  );
}

export default function Schedule() {
  const [activeDay, setActiveDay] = useState('day1');
  const [ref, setRef] = useState(null);
  const [visible, setVis] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVis(true); },
      { threshold: 0.1 }
    );
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref]);

  const currentSchedule = SCHEDULE[activeDay];

  return (
    <section className="section" id="schedule">
      <div className="schedule-container">
        <div ref={setRef} className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-label" style={{ textAlign: 'center' }}>Timeline</div>
          <div className="schedule-title">SCHEDULE</div>
        </div>

        <div className="day-tabs">
          <button
            className={`day-tab ${activeDay === 'day1' ? 'active' : ''}`}
            onClick={() => setActiveDay('day1')}
          >
            Prelims — {SCHEDULE.day1.date}
          </button>
          <button
            className={`day-tab ${activeDay === 'day2' ? 'active' : ''}`}
            onClick={() => setActiveDay('day2')}
          >
            Main Event — {SCHEDULE.day2.date}
          </button>
        </div>

        <div className="timeline" key={activeDay}>
          {currentSchedule.events.map((item, i) => (
            <TimelineItem
              key={`${activeDay}-${i}`}
              item={item}
              index={i}
              isActive={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
