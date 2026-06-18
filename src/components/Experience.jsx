import { EXPERIENCE } from '../data/experience.js';
import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';

export default function Experience() {
  return (
    <section
      id="experience"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]"
    >
      <div className="max-w-[1100px] mx-auto">
        <Reveal>
          <Eyebrow no="05">Experience</Eyebrow>
          <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">
            Where I&rsquo;ve been.
          </h2>
        </Reveal>

        <div className="mt-[clamp(40px,7vh,72px)]">
          {EXPERIENCE.map((x) => (
            <Reveal
              as="article"
              key={x.period}
              className="border-t border-ink/[0.12] py-[clamp(28px,4vh,44px)] flex flex-wrap gap-[clamp(16px,4vw,56px)]"
            >
              <span className="basis-[160px] shrink-0 font-mono text-[12px] tracking-[0.16em] uppercase text-ink/45 pt-1.5">
                {x.period}
              </span>
              <div className="flex-1 min-w-[280px]">
                <h3 className="font-display font-semibold text-[clamp(24px,3.2vw,38px)] leading-[1.08] m-0">
                  {x.role}
                </h3>
                <span className="block font-mono text-[12px] tracking-[0.12em] uppercase text-seal mt-2">
                  {x.org}
                </span>
                <p className="text-[15px] leading-[1.65] text-ink/[0.62] mt-3.5 max-w-[54ch]">
                  {x.blurb}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-ink/[0.12]" />
        </div>
      </div>
    </section>
  );
}
