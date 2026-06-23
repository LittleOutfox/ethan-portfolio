import Dot from './Dot.jsx';

export default function Hero({ onScrollToId }) {
  return (
    <section
      id="hero"
      className="min-h-[100svh] flex flex-col justify-between px-[clamp(20px,5vw,64px)] pt-[clamp(96px,14vh,160px)] pb-[clamp(28px,6vh,56px)]"
    >
      <div className="animate-heroRise flex justify-between gap-5 font-mono text-[11px] tracking-[0.24em] uppercase text-ink/45">
        <span>Electrical Engineering</span>
        <span>43.4723°N · 80.5449°W</span>
      </div>

      <div className="animate-heroRise [animation-delay:0.12s] max-w-[1400px]">
        <div className="font-mono text-[clamp(11px,1.4vw,13px)] tracking-[0.3em] uppercase text-ink/50 mb-[clamp(20px,3vh,36px)]">
          University of Waterloo
        </div>
        <h1 className="font-display font-black uppercase text-[clamp(58px,17vw,260px)] leading-[0.84] tracking-[-0.02em] m-0">
          Ethan
          <br />
          Tiong
        </h1>
        <p className="font-display font-medium text-[clamp(19px,2.6vw,36px)] leading-[1.35] text-ink/[0.66] mt-[clamp(24px,4vh,44px)] max-w-[24ch]">
          Building systems where hardware, code, and signal meet.
        </p>
        <div className="mt-[clamp(18px,2.4vh,28px)] flex flex-wrap gap-3.5 items-center font-mono text-[clamp(10px,1.05vw,12px)] tracking-[0.22em] uppercase text-ink/50">
          <span>Hardware</span>
          <Dot />
          <span>Firmware</span>
          <Dot />
          <span>Signal</span>
          <Dot />
          <span>Data</span>
        </div>
      </div>

      <div className="animate-heroRise [animation-delay:0.26s] flex items-end justify-between gap-5">
        <button
          type="button"
          onClick={() => onScrollToId('about')}
          className="cursor-pointer flex items-center gap-3 font-mono text-[11px] tracking-[0.24em] uppercase text-ink/55 transition-colors hover:text-ink"
        >
          <span className="text-seal">↓</span> Scroll
        </button>
        <span className="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/[0.42]">
          Open to embedded / hardware roles
        </span>
      </div>
    </section>
  );
}
