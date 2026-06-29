import { NOTES } from '../data/notes.js';
import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';

export default function Notes() {
  return (
    <section
      id="writing"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Eyebrow no="03">Technical Deep Dives</Eyebrow>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">
            Notes from the bench.
          </h2>
        </Reveal>

        <div className="mt-[clamp(40px,7vh,72px)] max-w-[920px]">
          {NOTES.map((d, i) => (
            <Reveal
              as="article"
              key={d.no}
              delay={Math.min(i, 5) * 70}
              className="border-t border-ink/[0.12] py-[clamp(28px,4vh,44px)] flex flex-wrap gap-[clamp(20px,4vw,56px)] items-baseline"
            >
              <span className="font-mono text-[13px] tracking-[0.18em] text-seal">{d.no}</span>
              <div className="flex-1 min-w-0 basis-full sm:basis-0">
                <h3 className="font-display font-semibold text-[clamp(24px,3.4vw,40px)] leading-[1.08] m-0">
                  {d.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-ink/60 mt-3 max-w-[52ch]">{d.blurb}</p>
              </div>
              <div className="flex flex-col gap-2 items-start font-mono text-[11px] tracking-[0.16em] uppercase text-ink/60 min-w-[120px]">
                <span>{d.tag}</span>
                <span className="text-ink/55">{d.read}</span>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-ink/[0.12]" />
        </div>
      </div>
    </section>
  );
}
