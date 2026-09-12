import { offTheClock } from '../../content/skills'
import styles from './OffTheClock.module.css'

export function OffTheClock() {
  return (
    <section id="off-the-clock" className={`section ${styles.section}`} aria-labelledby="otc-h">
      <div className={`container ${styles.grid}`}>
        <h2 id="otc-h" className={`t-heading-quiet ${styles.heading}`}>
          Off the clock
        </h2>
        <ul className={styles.list}>
          {offTheClock.map((h) => (
            <li key={h.name} className={styles.item}>
              <span className={`t-label ${styles.name}`}>{h.name}</span>
              <span className="t-meta">{h.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
