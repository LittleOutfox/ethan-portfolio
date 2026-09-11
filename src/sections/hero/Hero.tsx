import { links, profile } from '../../content/profile'
import { Icon } from '../../components/Icon'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-name">
      <div className={`container ${styles.grid}`}>
        <div className={styles.block}>
          <h1 id="hero-name" className="t-display">
            {profile.name}
          </h1>
          <p className={styles.role}>{profile.role}</p>
          <p className={`t-body ${styles.standfirst}`}>{profile.standfirst}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Program</dt>
              <dd>{profile.school}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{profile.experienceLine}</dd>
            </div>
            <div>
              <dt>Built</dt>
              <dd>{profile.built}</dd>
            </div>
            <div>
              <dt>Based</dt>
              <dd>{profile.based}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{profile.status}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <a className="button" href={links.resume.href} target="_blank" rel="noopener">
              View résumé
              <Icon name="external" />
            </a>
            <div className={styles.links}>
              <a className="link" href={links.github.href} target="_blank" rel="noopener">
                GitHub
              </a>
              <a className="link" href={links.linkedin.href} target="_blank" rel="noopener">
                LinkedIn
              </a>
              <a className="link" href={links.email.href}>
                {links.email.label}
              </a>
            </div>
          </div>
        </div>

        <div className={styles.plate} aria-hidden="true">
          <div className={styles.cell} data-plate="a">
            <img
              className={styles.poster}
              src="/fox/sitting-bloom.webp"
              width={648}
              height={483}
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className={styles.rule} />
        </div>
      </div>
    </section>
  )
}
