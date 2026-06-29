import { useEffect, useRef, useState } from 'react';

import KitsuneFigure from './KitsuneFigure.jsx';

const DESKTOP_MIN = 820;

/* ── The relay (static placement) ────────────────────────────────────────────
 * One entry per section — each fox placed + sized individually in its own
 * negative space, per the reference comps. The scroll choreography
 * (dissolve → reform into ink) was removed for now; we'll revisit motion later.
 *
 * place:
 *   - hero is anchored to the page top (top).
 *   - the rest are anchored to their section: top = (section top) + seatVh*vh,
 *     set in JS once layout settles.
 *   - side/edge picks which viewport edge the fox hugs.
 * These positions are first-pass from the references and meant to be nudged. */
const STOPS = [
  {
    key: 'hero',
    pose: 'hero',
    section: null,
    place: { top: '24svh', side: 'right', edge: 'clamp(8px, 3vw, 70px)', width: 'clamp(480px, 50vw, 960px)' },
  },
  {
    key: 'about',
    pose: 'about',
    section: 'about',
    place: { seatVh: 0.16, side: 'right', edge: 'clamp(8px, 4vw, 90px)', width: 'clamp(360px, 38vw, 720px)' },
  },
  {
    key: 'work',
    pose: 'work',
    section: 'work',
    place: { seatVh: 0.66, side: 'left', edge: 'clamp(2px, 0.6vw, 20px)', width: 'clamp(200px, 16vw, 330px)' },
  },
  {
    key: 'notes',
    pose: 'notes',
    section: 'writing',
    place: { seatVh: 0.22, side: 'right', edge: 'clamp(8px, 3vw, 64px)', width: 'clamp(360px, 27vw, 500px)' },
  },
  {
    key: 'skills',
    pose: 'skills',
    section: 'skills',
    place: { seatVh: 0.12, side: 'right', edge: 'clamp(8px, 3vw, 70px)', width: 'clamp(240px, 21vw, 400px)' },
  },
  {
    key: 'experience',
    pose: 'experience',
    section: 'experience',
    place: { seatVh: 0.4, side: 'right', edge: 'clamp(8px, 2.5vw, 50px)', width: 'clamp(440px, 38vw, 660px)' },
    // whereivebeen.svg has a stray traced dash floating top-right of the head;
    // clip that empty corner away (the head and tails sit well clear of it).
    clip: 'polygon(0 0, 80% 0, 80% 40%, 100% 40%, 100% 100%, 0 100%)',
  },
  {
    key: 'contact',
    pose: 'contact',
    section: 'contact',
    // Walks off the page: a NEGATIVE right offset overruns the viewport edge so
    // the fox's leading body clips at the page boundary (root has overflow-x:clip),
    // leaving the nine tails trailing in-frame. Reads as exiting stage-right.
    place: { seatVh: 0.24, side: 'right', edge: 'clamp(-260px, -11vw, -150px)', width: 'clamp(460px, 42vw, 760px)' },
  },
];

const posStyle = (stop) => {
  const s = { width: stop.place.width, top: stop.section ? 0 : stop.place.top };
  s[stop.place.side] = stop.place.edge;
  return s;
};

/* KitsuneScene — places one fox per section (see STOPS), each seated in its
 * negative space. Static for now (no scroll motion). Desktop only (conditional
 * mount → phones never download the assets). aria-hidden, pointer-events-none,
 * z-[1] (above the ink, below all page content). */
export default function KitsuneScene() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches,
  );
  const refs = useRef({});

  // Desktop gate.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Seat each section-anchored fox at its measured page position.
  useEffect(() => {
    if (!desktop) return undefined;
    const measure = () => {
      const vh = window.innerHeight || 1;
      STOPS.forEach((stop) => {
        if (!stop.section) return;
        const sec = document.getElementById(stop.section);
        const unit = refs.current[stop.key];
        if (!sec || !unit) return;
        const top = sec.getBoundingClientRect().top + window.scrollY;
        unit.style.top = `${Math.round(top + vh * stop.place.seatVh)}px`;
      });
    };
    measure();
    const settle = window.setTimeout(measure, 300); // re-measure once fonts/layout settle
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [desktop]);

  if (!desktop) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {STOPS.map((stop) => (
        <div
          key={stop.key}
          ref={(el) => (refs.current[stop.key] = el)}
          className="absolute"
          style={posStyle(stop)}
        >
          <KitsuneFigure
            pose={stop.pose}
            className="block h-auto w-full opacity-90"
            style={stop.clip ? { clipPath: stop.clip } : undefined}
          />
        </div>
      ))}
    </div>
  );
}
