import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { Atmosphere } from './components/Atmosphere'
import { FieldMount } from './components/FieldMount'
import { Hero } from './sections/hero/Hero'
import { About } from './sections/about/About'
import { Experience } from './sections/experience/Experience'
import { Projects } from './sections/projects/Projects'
import { Skills } from './sections/skills/Skills'
import { OffTheClock } from './sections/off-the-clock/OffTheClock'
import { Contact, SiteFooter } from './sections/contact/Contact'
import { hydrateMotionPrefs } from './motion/motionPrefs'

export function App() {
  useEffect(() => {
    hydrateMotionPrefs()
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Atmosphere />
      <FieldMount />
      <Nav />
      <main id="main" className="page" tabIndex={-1}>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <OffTheClock />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
