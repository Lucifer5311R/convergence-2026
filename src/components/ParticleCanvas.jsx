import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseLeave);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const mouse = mouseRef.current;

      // 1. Draw Grid with gravitational distortion from mouse
      const gridSize = 60;
      ctx.lineWidth = 0.5;

      // Vertical Grid Lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(17, 17, 17, 0.025)';
        for (let y = 0; y < canvas.height; y += 10) {
          let targetX = x;
          let targetY = y;

          if (mouse.active) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const force = (200 - dist) / 200;
              // Warp lines slightly towards the cursor
              targetX += (dx / dist) * force * 15;
            }
          }

          if (y === 0) ctx.moveTo(targetX, targetY);
          else ctx.lineTo(targetX, targetY);
        }
        ctx.stroke();
      }

      // Horizontal Grid Lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(17, 17, 17, 0.025)';
        for (let x = 0; x < canvas.width; x += 10) {
          let targetX = x;
          let targetY = y;

          if (mouse.active) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const force = (200 - dist) / 200;
              // Warp lines slightly towards the cursor
              targetY += (dy / dist) * force * 15;
            }
          }

          if (x === 0) ctx.moveTo(targetX, targetY);
          else ctx.lineTo(targetX, targetY);
        }
        ctx.stroke();
      }

      // 2. Draw subtle mathematical axes (static or slightly responsive)
      ctx.strokeStyle = 'rgba(193, 18, 31, 0.05)';
      ctx.lineWidth = 1;
      
      // X Axis
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();

      // Y Axis
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();

      // 3. Draw a breathing Lissajous curve in the center background
      // x = A * sin(a * t + delta), y = B * sin(b * t)
      ctx.strokeStyle = 'rgba(193, 18, 31, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const numPoints = 300;
      const scaleX = Math.min(canvas.width * 0.35, 300);
      const scaleY = Math.min(canvas.height * 0.35, 300);
      const a = 3;
      const b = 4;
      const delta = time * 0.5;

      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const lx = cx + scaleX * Math.sin(a * theta + delta);
        const ly = cy + scaleY * Math.sin(b * theta);
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();

      // 4. Draw faint polar coordinate concentric rings
      ctx.strokeStyle = 'rgba(17, 17, 17, 0.015)';
      ctx.lineWidth = 0.5;
      for (let r = 100; r < Math.max(canvas.width, canvas.height); r += 150) {
        ctx.beginPath();
        // Pulsate radius slightly
        const pulsateR = r + Math.sin(time) * 10;
        ctx.arc(cx, cy, pulsateR, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseLeave);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" />;
}
