import { useEffect, useRef, useState } from 'react'
import { links, profile } from '../content/profile'
import { PauseMotion } from './PauseMotion'
import styles from './Nav.module.css'

export const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    let raf = 0
    let last = window.scrollY > 48
    setScrolled(last)
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const next = window.scrollY > 48
        if (next !== last) {
          last = next
          setScrolled(next)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

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
              <a href={links.resume.href} target="_blank" rel="noopener">
                Résumé
              </a>
            </li>
          </ul>
        </nav>
        <PauseMotion className={`${styles.pause} ${styles.desktopOnly}`} />
        <button type="button" className={styles.menuButton} onClick={openMenu} aria-haspopup="dialog">
          Menu
        </button>
      </div>

      <dialog ref={dialogRef} className={styles.sheet} aria-label="Sections" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
        <div className={styles.sheetInner}>
          <div className={styles.sheetTop}>
            <span className={styles.wordmark}>{profile.name}</span>
            <button type="button" className={styles.menuButton} onClick={closeMenu}>
              Close
            </button>
          </div>
          <ul className={styles.sheetList}>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={closeMenu}>
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a href={links.resume.href} target="_blank" rel="noopener" onClick={closeMenu}>
                Résumé
              </a>
            </li>
            <li>
              <a href={links.github.href} target="_blank" rel="noopener" onClick={closeMenu}>
                GitHub
              </a>
            </li>
            <li>
              <a href={links.linkedin.href} target="_blank" rel="noopener" onClick={closeMenu}>
                LinkedIn
              </a>
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
        </div>
      </dialog>
    </header>
  )
}
