import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';
import SystemsGrid from './SystemsGrid.jsx';

export default function About() {
  return (
    <section
      id="about"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Eyebrow no="01">Identity</Eyebrow>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6 max-w-[16ch]">
            I turn invisible systems into tangible things.
          </h2>
        </Reveal>

        <Reveal delay={160} className="mt-[clamp(36px,6vh,64px)] max-w-[60ch]">
          <p className="text-[clamp(16px,1.7vw,21px)] leading-[1.7] text-ink/70 m-0">
            Signals, circuits, code, and hardware — ideas becoming real. I&rsquo;m an Electrical Engineering
            student who works at the seam where the electrical meets the physical: embedded firmware,
            board-level hardware, and the quiet, disciplined systems that sit beneath the surface and
            simply work.
          </p>
          <div className="mt-[clamp(22px,3.4vh,34px)] flex flex-wrap gap-x-[18px] gap-y-2.5 items-center font-mono text-[11px] tracking-[0.14em] uppercase text-ink/50">
            <span className="text-seal">▸</span>
            <span>Electrical Engineering · Waterloo</span>
            <span className="text-ink/[0.28]">/</span>
            <span>Embedded &amp; hardware focus</span>
          </div>
        </Reveal>

        <SystemsGrid />
      </div>
    </section>
  );
}
