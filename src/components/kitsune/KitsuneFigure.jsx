import bowingUrl from '../../assets/kitsune/bowing.svg';
import descendingUrl from '../../assets/kitsune/descending.svg';
import divingUrl from '../../assets/kitsune/diving.svg';
import howlingUrl from '../../assets/kitsune/howling.svg';
import sittingUrl from '../../assets/kitsune/sitting.svg';
import standingUrl from '../../assets/kitsune/standing.svg';
import walkingUrl from '../../assets/kitsune/walking.svg';

/* KitsuneFigure — renders one kitsune pose as an <img> (the SVGs are large, so
 * loading them as image assets keeps them out of the JS bundle and lets the
 * browser rasterize them once). Keyed by section; the file is named for the
 * pose it depicts. */
const POSES = {
  hero: sittingUrl,
  about: bowingUrl,
  work: descendingUrl,
  notes: divingUrl,
  skills: standingUrl,
  experience: howlingUrl,
  contact: walkingUrl,
};

export default function KitsuneFigure({ pose = 'hero', className = '', style }) {
  const src = POSES[pose];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      loading="lazy"
      className={className}
      style={style}
    />
  );
}
