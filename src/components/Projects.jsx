import { PROJECTS } from '../data/projects.js';
import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';

export default function Projects() {
  return (
    <section
      id="work"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Eyebrow no="02">Featured Projects</Eyebrow>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">
            Selected work.
          </h2>
        </Reveal>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(24px,3vw,44px)] mt-[clamp(48px,8vh,90px)]">
          {PROJECTS.map((p, i) => (
            <Reveal
              as="article"
              key={p.no}
              delay={Math.min(i, 5) * 70}
              className="group border border-ink/[0.12] p-[clamp(24px,2.4vw,32px)] flex flex-col gap-[22px] bg-white/50 transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] hover:border-ink/[0.34] hover:shadow-[0_18px_40px_-24px_rgba(21,17,13,0.45)] motion-safe:hover:-translate-y-1"
            >
              <div className="flex justify-between items-start font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 transition-colors duration-300 group-hover:text-ink/80">
                <span className="flex items-center gap-[9px]">
                  <span className="text-seal">{p.no}</span>
                  <span className="text-ink/[0.22]">/</span>
                  <span className="tracking-[0.16em] text-ink/60">{p.meta}</span>
                </span>
                <span>{p.year}</span>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden border border-ink/[0.12] flex items-end p-3.5 [background-image:linear-gradient(rgba(21,17,13,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(21,17,13,0.05)_1px,transparent_1px)] [background-size:22px_22px] transition-colors duration-300 group-hover:border-ink/30">
                {/* decorative technical-plate motif: registration ticks + a
                    circuit trace with a seal node. Static → reduced-motion safe. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 75"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full text-ink/20 transition-colors duration-300 group-hover:text-ink/40"
                >
                  <path
                    d="M6 6 H12 M6 6 V12 M94 6 H88 M94 6 V12 M6 69 H12 M6 69 V63 M94 69 H88 M94 69 V63"
                    stroke="currentColor"
                    strokeWidth="0.4"
                    fill="none"
                  />
                  <path
                    d="M14 56 H34 V40 H60 V22 H82"
                    stroke="currentColor"
                    strokeWidth="0.55"
                    fill="none"
                  />
                  <circle cx="34" cy="40" r="1.3" fill="currentColor" />
                  <circle cx="60" cy="22" r="1.3" fill="currentColor" />
                  <circle cx="82" cy="22" r="1.9" fill="#7A1712" />
                </svg>
                <span className="relative font-mono text-[10.5px] tracking-[0.2em] uppercase text-ink/60 transition-colors duration-300 group-hover:text-ink/80">
                  {p.img}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <h3 className="font-display font-semibold text-[clamp(26px,3vw,34px)] leading-[1.05] m-0">
                  {p.title}
                </h3>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/60">
                  {p.kind}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-ink/60 flex items-center gap-2 mt-0.5">
                  <span className="w-[5px] h-[5px] rounded-full shrink-0 bg-seal" />
                  {p.spec}
                </span>
                <p className="text-[15px] leading-[1.6] text-ink/[0.62] mt-2">{p.blurb}</p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-1.5">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink/60 border border-ink/[0.16] px-2.5 py-[5px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
