import { links, profile, site } from '../../content/profile'
import { ExternalLink } from '../../components/ExternalLink'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <section id="contact" className={`section ${styles.contact}`} aria-labelledby="contact-h">
      <div className={`container ${styles.grid}`}>
        <div className={styles.block}>
          <h2 id="contact-h" className="t-heading">
            Contact
          </h2>
          <a className={styles.email} href={links.email.href}>
            {links.email.label}
          </a>
          <ul className={styles.links}>
            <li>
              <ExternalLink className="link" href={links.github.href}>
                GitHub
              </ExternalLink>
            </li>
            <li>
              <ExternalLink className="link" href={links.linkedin.href}>
                LinkedIn
              </ExternalLink>
            </li>
            <li>
              <ExternalLink className="link" href={links.resume.href}>
                Résumé
              </ExternalLink>
            </li>
          </ul>
          <p className={`t-meta ${styles.status}`}>
            {profile.status} · {profile.based}
          </p>
        </div>

        <div className={styles.plate} aria-hidden="true">
          <div className={styles.cell} data-plate="b">
            <img className={styles.poster} src="/fox/bowing-bloom.webp" width={648} height={576} alt="" loading="lazy" decoding="async" />
          </div>
          <div className={styles.rule} />
        </div>
      </div>
    </section>
  )
}

/** The site footer sits after main so it is the page's contentinfo landmark. */
export function SiteFooter() {
  return (
    <footer className={`container ${styles.footer}`}>
      <p className="t-meta">{site.copyright}</p>
      <p className="t-meta">{site.colophon}</p>
      <p className={styles.signature} aria-hidden="true">
        {site.signature}
      </p>
    </footer>
  )
}
