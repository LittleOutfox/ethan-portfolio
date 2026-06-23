import { useEffect, useRef, useState } from 'react';

import useReducedMotion from '../hooks/useReducedMotion.js';

export default function Eyebrow({ no, children }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (reduced) {
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setDrawn(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-3.5 font-mono text-[12px] tracking-[0.28em] uppercase text-ink/60"
    >
      <span className="text-seal">{no}</span>
      {/* Hairline draws in left-to-right as a beat after the label settles.
          Reduced motion: drawn=true immediately → rests at full width (never
          left invisible), and the global CSS guard zeroes the transition. */}
      <span
        className={`w-10 h-px bg-ink/25 origin-left transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] ${
          drawn ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ transitionDelay: drawn && !reduced ? '140ms' : '0ms' }}
      />
      <span>{children}</span>
    </div>
  );
}
