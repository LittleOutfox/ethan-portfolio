import { SYSTEMS } from '../data/systems.js';
import Reveal from './Reveal.jsx';

export default function SystemsGrid() {
  return (
    <Reveal delay={200} className="mt-[clamp(56px,9vh,110px)]">
      <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 mb-[clamp(24px,4vh,40px)]">
        Layers I work across <span className="text-ink/55">· nine tails</span>
      </div>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-px bg-ink/10 border border-ink/10">
        {SYSTEMS.map((t, i) => (
          <div
            key={t}
            className="bg-[#f7f4ec] p-[clamp(20px,3vw,32px)] flex flex-col gap-3.5 min-h-[130px]"
          >
            <span className="font-mono text-[12px] tracking-[0.18em] text-seal">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-display font-bold text-[clamp(18px,2vw,24px)] leading-[1.15] mt-auto">
              {t}
            </span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
