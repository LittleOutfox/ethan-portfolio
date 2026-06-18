import { useEffect, useRef } from 'react';

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function InkCanvasPlaceholder() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const blooms = Array.from({ length: 8 }, (_, i) => ({
      x: [0.86, 0.94, 0.78, 0.72, 0.06, 0.12, 0.5, 1.02][i],
      y: [0.24, 0.62, 0.88, 0.46, 0.18, 0.82, 1.04, 0.4][i],
      r: (i % 3 === 0 ? 0.5 : 0.34) + Math.random() * 0.34,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.8,
    }));

    const draw = (time) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = time * 0.0001;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f4f1e9';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply';
      blooms.forEach((b, i) => {
        const cx = (b.x + Math.sin(t * b.sp + b.ph) * 0.06) * w;
        const cy = (b.y + Math.cos(t * b.sp * 0.8 + b.ph) * 0.06) * h;
        const rad = b.r * Math.min(w, h) * (0.92 + Math.sin(t * b.sp * 0.7 + i) * 0.08);
        const a = 0.06;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(34,28,22,${a})`);
        g.addColorStop(0.4, `rgba(34,28,22,${a * 0.5})`);
        g.addColorStop(1, 'rgba(244,241,233,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      const rg = ctx.createLinearGradient(0, 0, w, 0);
      rg.addColorStop(0, 'rgba(244,241,233,0.35)');
      rg.addColorStop(0.32, 'rgba(244,241,233,0.78)');
      rg.addColorStop(0.6, 'rgba(244,241,233,0.5)');
      rg.addColorStop(1, 'rgba(244,241,233,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(
        w / 2,
        h * 0.46,
        Math.min(w, h) * 0.18,
        w / 2,
        h * 0.5,
        Math.max(w, h) * 0.78,
      );
      vg.addColorStop(0, 'rgba(244,241,233,0)');
      vg.addColorStop(1, 'rgba(120,104,82,0.1)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none block"
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN_URL }}
      />
    </>
  );
}
