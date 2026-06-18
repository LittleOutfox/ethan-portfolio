import { NAV } from '../data/nav.js';

export default function Navbar({ active, isMobile, navOpen, onToggle, onSelect, onLogo }) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-[clamp(20px,5vw,64px)] py-[18px] [background:linear-gradient(180deg,rgba(244,241,233,0.86)_0%,rgba(244,241,233,0)_100%)] backdrop-blur-sm">
        <span
          onClick={onLogo}
          className="cursor-pointer font-mono text-[12px] tracking-[0.26em] uppercase text-ink"
        >
          Ethan&nbsp;Tiong<span className="text-ink/35">&nbsp;/&nbsp;EE</span>
        </span>

        {!isMobile && (
          <nav className="flex items-center gap-[26px]">
            {NAV.map((l) => (
              <span
                key={l.id}
                onClick={() => onSelect(l.id)}
                className={`cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase flex items-center gap-[7px] transition-colors hover:text-ink ${
                  active === l.id ? 'text-ink' : 'text-ink/50'
                }`}
              >
                {active === l.id && <span className="w-[5px] h-[5px] rounded-full bg-seal" />}
                {l.label}
              </span>
            ))}
          </nav>
        )}

        {isMobile && (
          <span
            onClick={onToggle}
            className="cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink"
          >
            Menu
          </span>
        )}
      </header>

      {navOpen && (
        <div className="fixed inset-0 z-[60] bg-paper/95 backdrop-blur-md flex flex-col justify-center gap-1.5 p-[clamp(28px,9vw,80px)]">
          <span
            onClick={onToggle}
            className="absolute top-[22px] right-[clamp(20px,5vw,64px)] cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink/60"
          >
            Close
          </span>
          {NAV.map((l) => (
            <span
              key={l.id}
              onClick={() => onSelect(l.id)}
              className="cursor-pointer font-display font-bold text-[clamp(34px,9vw,60px)] leading-[1.05] text-ink"
            >
              {l.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
