import { profile } from '../../content/profile'
import styles from './About.module.css'

export function About() {
  const [engineering, fox] = profile.bio
  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-h">
      <div className="container">
        <h2 id="about-h" className="t-heading">
          About
        </h2>
        <div className={styles.grid}>
          <div className={styles.prose}>
            <p className="t-lede">{engineering}</p>
            <p className="t-body">{fox}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
