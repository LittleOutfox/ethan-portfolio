import aboutUrl from '../../assets/kitsune/about.svg';
import contactUrl from '../../assets/kitsune/contact.svg';
import homeUrl from '../../assets/kitsune/home.svg';
import notesUrl from '../../assets/kitsune/notes.svg';
import workUrl from '../../assets/kitsune/selected_work.svg';
import toolsUrl from '../../assets/kitsune/tools.svg';
import beenUrl from '../../assets/kitsune/whereivebeen.svg';

/* KitsuneFigure — renders one kitsune pose as an <img> (the SVGs are large, so
 * loading them as image assets keeps them out of the JS bundle and lets the
 * browser rasterize them once). Keyed by section. */
const POSES = {
  hero: homeUrl,
  about: aboutUrl,
  work: workUrl,
  notes: notesUrl,
  skills: toolsUrl,
  experience: beenUrl,
  contact: contactUrl,
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
