import { useCallback, useEffect, useRef, useState } from 'react';

import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Experience from './components/Experience.jsx';
import FooterStatus from './components/FooterStatus.jsx';
import FluidInkCanvas from './components/FluidInkCanvas.jsx';
import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import Notes from './components/Notes.jsx';
import Projects from './components/Projects.jsx';
import Skills from './components/Skills.jsx';

const MOBILE_BREAKPOINT = 820;

export default function Portfolio() {
  const rootRef = useRef(null);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState('hero');
  const [footerVisible, setFooterVisible] = useState(false);
  const isMobile = vw < MOBILE_BREAKPOINT;

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;

    const sectionIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    root.querySelectorAll('section[id]').forEach((s) => sectionIO.observe(s));

    const footer = root.querySelector('footer');
    // rootMargin extends the bottom of the root box so the status pill fades out
    // well before the footer is actually on screen — prevents overlap with the
    // contact section's maker's-mark seal.
    const footerIO =
      footer &&
      new IntersectionObserver(
        ([e]) => setFooterVisible(e.isIntersecting),
        { rootMargin: '0px 0px 320px 0px', threshold: 0 },
      );
    if (footer) footerIO.observe(footer);

    return () => {
      sectionIO.disconnect();
      if (footerIO) footerIO.disconnect();
    };
  }, []);

  const scrollToId = useCallback((id) => {
    const el = rootRef.current?.querySelector(`#${id}`);
    if (el) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top - 56,
        behavior: reduced ? 'auto' : 'smooth',
      });
    }
    setNavOpen(false);
  }, []);

  const scrollTop = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    setNavOpen(false);
  }, []);

  const toggleNav = useCallback(() => setNavOpen((o) => !o), []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen bg-transparent text-ink font-sans font-normal antialiased [overflow-x:clip]"
    >
      <FluidInkCanvas />

      <Navbar
        active={active}
        isMobile={isMobile}
        navOpen={navOpen}
        onToggle={toggleNav}
        onSelect={scrollToId}
        onLogo={scrollTop}
      />

      <main className="relative z-[2]">
        <Hero onScrollToId={scrollToId} />
        <About />
        <Projects />
        <Notes />
        <Skills />
        <Experience />
        <Contact />
        <FooterStatus footerVisible={footerVisible} onScrollTop={scrollTop} />
      </main>
    </div>
  );
}
