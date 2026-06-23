import { CONTACT_EMAIL, SOCIALS } from '../data/socials.js';
import Eyebrow from './Eyebrow.jsx';
import Reveal from './Reveal.jsx';

export default function Contact() {
  return (
    <section
      id="contact"
      className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] pt-[clamp(110px,20vh,260px)] pb-[clamp(60px,10vh,120px)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Eyebrow no="06">Contact</Eyebrow>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="font-display font-black text-[clamp(46px,9vw,150px)] leading-[0.98] tracking-[-0.02em] mt-7">
            Let&rsquo;s build
            <br />
            something real.
          </h2>
        </Reveal>

        <Reveal
          delay={140}
          className="mt-[clamp(44px,7vh,80px)] flex flex-wrap gap-[clamp(28px,6vw,80px)] items-end justify-between"
        >
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-display italic font-medium text-[clamp(24px,4vw,46px)] text-ink no-underline border-b border-ink/30 pb-1.5 transition-colors hover:border-seal"
          >
            {CONTACT_EMAIL}
          </a>
          <div className="flex flex-wrap gap-6 font-mono text-[12px] tracking-[0.16em] uppercase">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="relative inline-block text-ink/60 no-underline transition-colors duration-300 hover:text-ink after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:bg-ink after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-[cubic-bezier(.2,.7,.2,1)] hover:after:scale-x-100"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal
          delay={220}
          className="mt-[clamp(52px,9vh,100px)] pt-[clamp(22px,3vh,32px)] border-t border-ink/[0.12] flex items-center justify-end gap-[18px]"
        >
          <div className="text-right font-mono text-[10.5px] tracking-[0.2em] uppercase leading-[1.7] text-ink/45">
            <div>Maker&rsquo;s mark</div>
            <div className="text-ink/[0.32]">九尾 · nine tails</div>
          </div>
          <div className="shrink-0 w-[clamp(48px,5.5vw,60px)] h-[clamp(48px,5.5vw,60px)] border-[1.5px] border-seal rounded-lg flex items-center justify-center -rotate-3 [box-shadow:inset_0_0_0_3px_rgba(244,241,233,0.7)] transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] motion-safe:hover:rotate-0 motion-safe:hover:scale-[1.05]">
            <span className="font-display font-semibold text-[clamp(26px,3vw,32px)] leading-none text-seal">
              九
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
