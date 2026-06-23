import { SKILLS } from '../data/skills.js';
import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';

export default function Skills() {
  return (
    <section
      id="skills"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Eyebrow no="04">Skills &amp; Tools</Eyebrow>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">
            Tools of the trade.
          </h2>
        </Reveal>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-[clamp(28px,3vw,48px)] mt-[clamp(48px,8vh,90px)]">
          {SKILLS.map((g, i) => (
            <Reveal key={g.title} delay={Math.min(i, 5) * 70}>
              <h3 className="font-display font-semibold text-[clamp(20px,2.2vw,26px)] m-0 mb-5 pb-3.5 border-b border-ink/[0.16]">
                {g.title}
              </h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {g.items.map((it) => (
                  <li key={it} className="font-mono text-[13px] tracking-[0.04em] text-ink/[0.65]">
                    {it}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
