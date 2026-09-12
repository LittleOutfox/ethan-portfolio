import { useRef, useSyncExternalStore } from 'react'
import { links, profile } from '../content/profile'
import { PauseMotion } from './PauseMotion'
import { ExternalLink } from './ExternalLink'
import styles from './Nav.module.css'

const SCROLLED_AT = 48

function subscribeScroll(onChange: () => void) {
  let raf = 0
  let last = window.scrollY > SCROLLED_AT
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      const next = window.scrollY > SCROLLED_AT
      if (next !== last) {
        last = next
        onChange()
      }
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    window.removeEventListener('scroll', onScroll)
    if (raf) cancelAnimationFrame(raf)
  }
}

/** true once the page has scrolled past the top; false on the server so markup matches */
function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, () => window.scrollY > SCROLLED_AT, () => false)
}

export const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const

export function Nav() {
  const scrolled = useScrolled()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const openMenu = () => dialogRef.current?.showModal()
  const closeMenu = () => dialogRef.current?.close()

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={`container ${styles.bar}`}>
        <a className={styles.wordmark} href="#top">
          {profile.name}
        </a>
        <nav className={styles.links} aria-label="Sections">
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.label}</a>
              </li>
            ))}
            <li>
              <ExternalLink href={links.resume.href}>Résumé</ExternalLink>
            </li>
          </ul>
        </nav>
        <PauseMotion className={`${styles.pause} ${styles.desktopOnly}`} />
        <button type="button" className={styles.menuButton} onClick={openMenu} aria-haspopup="dialog">
          Menu
        </button>
      </div>

      <dialog ref={dialogRef} className={styles.sheet} aria-label="Menu" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
        <div className={styles.sheetInner}>
          <div className={styles.sheetTop}>
            <span className={styles.wordmark}>{profile.name}</span>
            <button type="button" className={styles.menuButton} onClick={closeMenu}>
              Close
            </button>
          </div>
          <nav aria-label="Menu">
            <ul className={styles.sheetList}>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={closeMenu}>
                    {s.label}
                  </a>
                </li>
              ))}
              <li>
                <ExternalLink href={links.resume.href} onClick={closeMenu}>
                  Résumé
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={links.github.href} onClick={closeMenu}>
                  GitHub
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={links.linkedin.href} onClick={closeMenu}>
                  LinkedIn
                </ExternalLink>
              </li>
              <li>
                <a href={links.email.href} onClick={closeMenu}>
                  {links.email.label}
                </a>
              </li>
              <li>
                <PauseMotion className={styles.sheetPause} />
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </header>
  )
}
