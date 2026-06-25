import homeUrl from '../../assets/kitsune/home.svg';

/* KitsuneFigure — renders one kitsune pose as an <img> (the SVGs are large,
 * so loading them as image assets keeps them out of the JS bundle and lets the
 * browser rasterize them once). Add more poses to POSES as they're integrated.
 * Only the hero "sit-proud" pose (home.svg) is wired up for this pass. */
const POSES = {
  'sit-proud': homeUrl,
};

export default function KitsuneFigure({ pose = 'sit-proud', className = '', style }) {
  const src = POSES[pose];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={className}
      style={style}
    />
  );
}
