import { useEffect, useState } from 'react';

import KitsuneFigure from './KitsuneFigure.jsx';

const DESKTOP_MIN = 820;

/* KitsuneScene — for now, only the static hero kitsune: the sit-proud fox in
 * the right-side hero negative space.
 *
 * Desktop only. We conditionally MOUNT (not just CSS-hide) below DESKTOP_MIN so
 * phones never put the <img> in the DOM and therefore never download the asset
 * for an image they wouldn't see — mobile stays lean and fast.
 *
 * - absolute, anchored to the hero region (scrolls away with the page)
 * - z-[1]: above the paper/ink background, BELOW page content (never blocks
 *   nav/text) and pointer-events-none
 * - gentle heroRise fade-in only; instant under prefers-reduced-motion via the
 *   global CSS guard. No scroll animation yet.
 *
 * Tuning: `top-[...]` (vertical seat), `right-[...]` (margin), `w-[clamp(...)]`
 * (scale), and the figure `opacity-*` below. */
export default function KitsuneScene() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!desktop) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-[1] right-[clamp(8px,3vw,70px)] top-[24svh] w-[clamp(480px,50vw,960px)] animate-heroRise [animation-delay:0.5s]"
    >
      <KitsuneFigure pose="sit-proud" className="w-full h-auto opacity-90" />
    </div>
  );
}
