import { experience } from '../../content/experience'
import styles from './Experience.module.css'

export function Experience() {
  return (
    <section id="experience" className={`section ${styles.experience}`} aria-labelledby="experience-h">
      <div className="container">
        <h2 id="experience-h" className="t-heading">
          Experience
        </h2>
        <ol className={styles.ledger}>
          {experience.map((e, i) => (
            <li key={i} className={styles.row} data-projected={e.projected || undefined} data-row={i}>
              <span className={`data ${styles.year}`}>{e.year}</span>
              <span className={styles.org}>{e.organization}</span>
              <span className={styles.role}>
                {e.role}
                {e.projected ? <span className="visually-hidden"> (projected)</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
