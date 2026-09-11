import { skills } from '../../content/skills'
import styles from './Skills.module.css'

export function Skills() {
  return (
    <section id="skills" className={`section ${styles.skills}`} aria-labelledby="skills-h">
      <div className="container">
        <h2 id="skills-h" className="t-heading">
          Skills
        </h2>
        <dl className={styles.list}>
          {skills.map((s) => (
            <div key={s.name} className={styles.entry}>
              <dt className="t-title">{s.name}</dt>
              <dd>
                <p className="t-body">{s.line}</p>
                {s.note ? <p className={`t-note ${styles.note}`}>{s.note}</p> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
