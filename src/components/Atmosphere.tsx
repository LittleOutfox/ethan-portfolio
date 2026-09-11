import styles from './Atmosphere.module.css'

/**
 * The weather: one moon wash that the scroll bus moves across the page, and a mist band in the
 * lower viewport. Both are fixed DOM layers behind the content; the point field is the only light.
 */
export function Atmosphere() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.wash} data-wash />
      <div className={styles.mist} />
    </div>
  )
}
