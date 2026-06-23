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
              <div className="flex justify-between items-start font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 transition-colors duration-300 group-hover:text-ink/60">
                <span className="flex items-center gap-[9px]">
                  <span className="text-seal">{p.no}</span>
                  <span className="text-ink/[0.22]">/</span>
                  <span className="tracking-[0.16em] text-ink/50">{p.meta}</span>
                </span>
                <span>{p.year}</span>
              </div>

              <div className="aspect-[4/3] border border-ink/[0.12] flex items-end p-3.5 [background:repeating-linear-gradient(135deg,rgba(21,17,13,0.045)_0_10px,transparent_10px_20px)] transition-colors duration-300 group-hover:border-ink/30 group-hover:bg-ink/[0.05]">
                <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-ink/40 transition-colors duration-300 group-hover:text-ink/70">
                  {p.img}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <h3 className="font-display font-semibold text-[clamp(26px,3vw,34px)] leading-[1.05] m-0">
                  {p.title}
                </h3>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/45">
                  {p.kind}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-ink/40 flex items-center gap-2 mt-0.5">
                  <span className="w-[5px] h-[5px] rounded-full shrink-0 bg-seal" />
                  {p.spec}
                </span>
                <p className="text-[15px] leading-[1.6] text-ink/[0.62] mt-2">{p.blurb}</p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-1.5">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink/50 border border-ink/[0.16] px-2.5 py-[5px]"
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
