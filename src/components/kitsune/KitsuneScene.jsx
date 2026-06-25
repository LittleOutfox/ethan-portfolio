import KitsuneFigure from './KitsuneFigure.jsx';

/* KitsuneScene — for now, only the static hero kitsune: the sit-proud fox in
 * the right-side hero negative space.
 *
 * - absolute, anchored to the hero region (scrolls away with the page)
 * - z-[1]: above the paper/ink background, BELOW page content (never blocks
 *   nav/text) and pointer-events-none
 * - desktop only (>=820px) so it doesn't crowd the mobile hero
 * - gentle heroRise fade-in only; instant under prefers-reduced-motion via the
 *   global CSS guard. No scroll animation yet.
 *
 * Tuning: `top-[...]` (vertical seat), `right-[...]` (margin), `w-[clamp(...)]`
 * (scale), and the figure `opacity-*` below. */
export default function KitsuneScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-[1] hidden min-[820px]:block right-[clamp(8px,3vw,70px)] top-[24svh] w-[clamp(480px,50vw,960px)] animate-heroRise [animation-delay:0.5s]"
    >
      <KitsuneFigure pose="sit-proud" className="w-full h-auto opacity-90" />
    </div>
  );
}
