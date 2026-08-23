// ============================================================
// CONVERGENCE 2026 — Custom Hooks
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

// --- Scroll Progress ---
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// --- IntersectionObserver Reveal ---
export function useRevealOnScroll(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

// --- Counter Animation ---
export function useCounter(end, duration = 2000, startOnVisible = false) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnVisible);

  const start = useCallback(() => setStarted(true), []);

  useEffect(() => {
    if (!started) return;
    let startTime;
    let animId;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [end, duration, started]);

  return [count, start];
}

// --- Countdown Timer ---
export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function getTimeLeft(target) {
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// --- 3D Card Tilt ---
export function useCardTilt() {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}

// --- Stagger Children Animation ---
export function useStaggerReveal(count, baseDelay = 100) {
  const ref = useRef(null);
  const [visibleItems, setVisibleItems] = useState(new Set());

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, i]));
            }, i * baseDelay);
          }
          obs.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(container);
    return () => obs.disconnect();
  }, [count, baseDelay]);

  return { ref, visibleItems };
}
