import { useEffect, useRef } from 'react';

import { NAV } from '../data/nav.js';

export default function Navbar({ active, isMobile, navOpen, onToggle, onSelect, onLogo }) {
  const toggleRef = useRef(null);
  const closeRef = useRef(null);
  const headerRef = useRef(null);
  const overlayRef = useRef(null);

  // Mobile menu when open: trap Tab within the panel, make the rest of the
  // page inert (header + main), close on Escape, move focus into the panel,
  // and restore focus to the toggle on close. Desktop never opens it.
  useEffect(() => {
    if (!navOpen) return undefined;
    const toggleEl = toggleRef.current; // persistent node; capture for cleanup
    const headerEl = headerRef.current;
    const mainEl = typeof document !== 'undefined' ? document.querySelector('main') : null;
    if (headerEl) headerEl.inert = true;
    if (mainEl) mainEl.inert = true;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onToggle();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = overlayRef.current;
      if (!root) return;
      const items = Array.from(
        root.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (headerEl) headerEl.inert = false;
      if (mainEl) mainEl.inert = false;
      toggleEl?.focus();
    };
  }, [navOpen, onToggle]);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-[clamp(20px,5vw,64px)] py-[18px] [background:linear-gradient(180deg,rgba(244,241,233,0.86)_0%,rgba(244,241,233,0)_100%)] backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={onLogo}
          className="cursor-pointer font-mono text-[12px] tracking-[0.26em] uppercase text-ink"
        >
          Ethan&nbsp;Tiong<span className="text-ink/55">&nbsp;/&nbsp;EE</span>
        </button>

        {!isMobile && (
          <nav className="flex items-center gap-[26px]">
            {NAV.map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => onSelect(l.id)}
                aria-current={active === l.id ? 'true' : undefined}
                className={`cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase flex items-center gap-[7px] transition-colors hover:text-ink ${
                  active === l.id ? 'text-ink' : 'text-ink/60'
                }`}
              >
                {/* Dot is always rendered (reserves its space) so the active
                    indicator fades/scales in without shifting the labels. */}
                <span
                  aria-hidden="true"
                  className={`w-[5px] h-[5px] rounded-full bg-seal transition-[opacity,transform] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${
                    active === l.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                />
                {l.label}
              </button>
            ))}
          </nav>
        )}

        {isMobile && (
          <button
            ref={toggleRef}
            type="button"
            onClick={onToggle}
            aria-expanded={navOpen}
            aria-controls="mobile-menu"
            className="tap-target cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink"
          >
            {navOpen ? 'Close' : 'Menu'}
          </button>
        )}
      </header>

      {/* Always mounted so open/close can animate; hidden + non-focusable
          when closed (pointer-events-none + tabIndex -1 on its controls). */}
      <div
        id="mobile-menu"
        ref={overlayRef}
        aria-hidden={!navOpen}
        className={`fixed inset-0 z-[60] bg-paper/95 backdrop-blur-md flex flex-col justify-center gap-1.5 p-[clamp(28px,9vw,80px)] transition-opacity duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${
          navOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onToggle}
          tabIndex={navOpen ? 0 : -1}
          className="tap-target absolute top-[22px] right-[clamp(20px,5vw,64px)] cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink/60"
        >
          Close
        </button>
        {NAV.map((l, i) => (
          <button
            type="button"
            key={l.id}
            onClick={() => onSelect(l.id)}
            tabIndex={navOpen ? 0 : -1}
            style={{ transitionDelay: navOpen ? `${i * 45 + 80}ms` : '0ms' }}
            className={`text-left cursor-pointer font-display font-bold text-[clamp(34px,9vw,60px)] leading-[1.05] text-ink transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
              navOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </>
  );
}
