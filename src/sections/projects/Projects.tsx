import { projects } from '../../content/projects'
import { Icon } from '../../components/Icon'
import { UartFigure } from '../../figures/UartFigure'
import styles from './Projects.module.css'

export function Projects() {
  const [lead, second, third] = projects
  return (
    <section id="projects" className={`section ${styles.projects}`} aria-labelledby="projects-h">
      <div className="container">
        <h2 id="projects-h" className="t-heading">
          Projects
        </h2>

        <div className={styles.top}>
          <article className={styles.plate} aria-labelledby={`p-${lead.id}`}>
            <div className={styles.plateText}>
              <h3 id={`p-${lead.id}`} className="t-title">
                {lead.title}
              </h3>
              <p className={`data ${styles.meta}`}>{lead.meta}</p>
              <p className={`t-body ${styles.desc}`}>{lead.description}</p>
              <p className={`data ${styles.stack}`}>{lead.stack}</p>
              {lead.link ? (
                <a className={`link ${styles.projectLink}`} href={lead.link.href} target="_blank" rel="noopener">
                  {lead.link.label}
                  <Icon name="external" size={14} />
                </a>
              ) : null}
            </div>
            <div className={styles.plateSide}>
              {lead.specs ? (
                <ul className={styles.specs} aria-label="Measured parameters">
                  {lead.specs.map((s) => (
                    <li key={s} className="data">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.figure}>
                <UartFigure id="uart" />
              </div>
            </div>
          </article>

          <article className={styles.aside} aria-labelledby={`p-${second.id}`}>
            <h3 id={`p-${second.id}`} className="t-title">
              {second.title}
            </h3>
            <p className={`data ${styles.meta}`}>{second.meta}</p>
            <p className={`t-body ${styles.desc}`}>{second.description}</p>
            <p className={`data ${styles.stack}`}>{second.stack}</p>
            {second.note ? <p className={`t-meta ${styles.note}`}>{second.note}</p> : null}
          </article>
        </div>

        <article className={styles.row} aria-labelledby={`p-${third.id}`}>
          <h3 id={`p-${third.id}`} className="t-title">
            {third.title}
          </h3>
          <div>
            <p className="t-body">{third.description}</p>
            <p className={`data ${styles.stack}`}>{third.stack}</p>
          </div>
          <div className={styles.rowMeta}>
            <p className="data">{third.meta}</p>
            {third.link ? (
              <a className={`link ${styles.projectLink}`} href={third.link.href} target="_blank" rel="noopener">
                {third.link.label}
                <Icon name="external" size={14} />
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )
}
