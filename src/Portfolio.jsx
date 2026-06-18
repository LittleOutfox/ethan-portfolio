import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ *
 * Ethan Tiong — Portfolio Shell (structural)
 * Cream paper / black ink / deep seal-red (#7A1712) accent.
 * Display: Fraunces · Body: IBM Plex Sans · Labels: IBM Plex Mono.
 *
 * The fixed <canvas> is a PLACEHOLDER. A dynamic WebGL ink-fluid
 * simulation will mount into it later — see initInkPlaceholder().
 * Tailwind tokens (paper / ink / seal / font-display|sans|mono) are
 * defined in export/tailwind.config.js.
 * ------------------------------------------------------------------ */

const ACCENT = '#7A1712';

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'writing', label: 'Notes' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

const TAILS = ['Firmware', 'Circuit design', 'PCB & wiring', 'Sensing', 'Power', 'Control loops', 'Data & ML', 'Prototyping', 'Debugging'];

const PROJECTS = [
  { no: '01', title: 'STM32 Projector Control System', kind: 'Embedded control · motorized optics', meta: 'MCU / STM32', blurb: 'Closed-loop firmware driving a motorized projector mount — PWM actuation with sensor feedback and a tuned control loop for smooth, repeatable positioning.', tags: ['STM32', 'C', 'PWM', 'UART'], spec: 'MCU STM32F4 · closed-loop · PWM', year: '2024', img: 'control board' },
  { no: '02', title: 'Aquaponics Systems Engineering', kind: 'Sensing · automation', meta: 'SENSOR LOOP', blurb: 'An instrumented aquaponics loop: pH, dissolved-oxygen and temperature sensing feeding relay-driven automation, with data logged for tuning.', tags: ['Sensors', 'Automation', 'Relays', 'Logging'], spec: 'pH / DO / temp · relay control', year: '2024', img: 'system rig' },
  { no: '03', title: 'InspiritAI Diabetes Prediction Model', kind: 'Machine learning · data', meta: 'PYTHON / MODELING', blurb: 'A supervised classification model for diabetes risk — feature engineering, model selection, and an honest read on what actually moved accuracy.', tags: ['Python', 'scikit-learn', 'Pandas', 'Modeling'], spec: 'classification · cross-validated', year: '2023', img: 'notebook' },
  { no: '04', title: 'Electric Vehicle Hardware Systems', kind: 'Power · high-voltage systems', meta: 'HARDWARE / DEBUG', blurb: 'Hardware work across an EV powertrain — high-voltage pack integration, battery management, and CAN-bus communication between subsystems.', tags: ['HV', 'BMS', 'CAN', 'Power'], spec: 'HV pack · BMS · CAN bus', year: '2023', img: 'pack assembly' },
  { no: '05', title: 'Dental Office Website + IT Systems', kind: 'Full-stack · IT', meta: 'WEB / DEPLOY', blurb: 'End-to-end build for a dental practice: a clean web front end plus the practical networking, deployment and IT systems behind it.', tags: ['Web', 'IT', 'Networking', 'Deploy'], spec: 'web stack · network · deploy', year: '2022', img: 'site / network' },
];

const NOTES = [
  { no: '01', title: 'Tuning a closed-loop projector mount', read: '8 min', tag: 'Embedded Control', blurb: 'PWM, feedback, and the gains that turned a twitchy STM32 mount into smooth, repeatable motion.' },
  { no: '02', title: 'Reading pH and DO without the drift', read: '6 min', tag: 'Sensing', blurb: 'Calibration, grounding, and filtering choices that kept an aquaponics sensor stack honest over weeks.' },
  { no: '03', title: 'What actually moved a diabetes model', read: '7 min', tag: 'ML / Data', blurb: 'Feature engineering over fancy models — where the accuracy really came from, and where it did not.' },
];

const SKILLS = [
  { title: 'Embedded / Hardware', items: ['C / C++', 'STM32 / ARM', 'PCB & breadboard', 'Sensors & actuators', 'UART / SPI / I2C'] },
  { title: 'Software', items: ['Python', 'JavaScript / Web', 'Git & CLI', 'SQL basics'] },
  { title: 'Engineering Tools', items: ['KiCad', 'Oscilloscope / DMM', 'Soldering & bring-up', 'MATLAB'] },
  { title: 'AI / Data', items: ['scikit-learn', 'Pandas / NumPy', 'Data cleaning', 'Model evaluation'] },
  { title: 'Interests', items: ['Embedded systems', 'EV hardware', 'Signal processing', 'Systems design'] },
];

const EXPERIENCE = [
  { period: '2024 — Now', role: 'Embedded / Hardware Co-op', org: 'Placeholder Co. · TBD', blurb: 'Firmware and board-level work on an embedded product — bring-up, debugging, and sensor integration.' },
  { period: '2023', role: 'Electronics Project Lead', org: 'Student Design Team', blurb: 'Led a small hardware build end to end: schematic, wiring, and microcontroller firmware for a working prototype.' },
  { period: '2022', role: 'Web & IT Freelance', org: 'Local Business', blurb: 'Built and deployed a website plus the networking and IT systems that kept it running day to day.' },
];

const SOCIALS = [
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Résumé', href: '#' },
  { label: 'Email', href: 'mailto:hello@ethantiong.dev' },
];

/* Scroll-reveal: fade + rise an element when it enters the viewport. */
function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(.2,.7,.2,1)] ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const Eyebrow = ({ no, children }) => (
  <div className="flex items-center gap-3.5 font-mono text-[12px] tracking-[0.28em] uppercase text-ink/45">
    <span className="text-seal">{no}</span>
    <span className="w-10 h-px bg-ink/25" />
    <span>{children}</span>
  </div>
);

export default function Portfolio() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState('hero');
  const [footerVisible, setFooterVisible] = useState(false);
  const isMobile = vw < 820;

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Scroll-spy for the active nav dot. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    root.querySelectorAll('section[id]').forEach((s) => io.observe(s));
    const footer = root.querySelector('footer');
    const fio = footer && new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting), { threshold: 0 });
    if (footer) fio.observe(footer);
    return () => { io.disconnect(); fio && fio.disconnect(); };
  }, []);

  /* Canvas PLACEHOLDER — faint ink wash + vignette only. Replace the
     body of this effect with the WebGL ink-fluid sim when ready. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const blooms = Array.from({ length: 8 }, (_, i) => ({
      x: [0.86, 0.94, 0.78, 0.72, 0.06, 0.12, 0.5, 1.02][i],
      y: [0.24, 0.62, 0.88, 0.46, 0.18, 0.82, 1.04, 0.4][i],
      r: (i % 3 === 0 ? 0.5 : 0.34) + Math.random() * 0.34,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.8,
    }));
    const draw = (time) => {
      const w = window.innerWidth, h = window.innerHeight, t = time * 0.0001;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f4f1e9';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply';
      blooms.forEach((b, i) => {
        const cx = (b.x + Math.sin(t * b.sp + b.ph) * 0.06) * w;
        const cy = (b.y + Math.cos(t * b.sp * 0.8 + b.ph) * 0.06) * h;
        const rad = b.r * Math.min(w, h) * (0.92 + Math.sin(t * b.sp * 0.7 + i) * 0.08);
        const a = 0.06;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(34,28,22,${a})`);
        g.addColorStop(0.4, `rgba(34,28,22,${a * 0.5})`);
        g.addColorStop(1, 'rgba(244,241,233,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      // readability wash over the central reading column
      ctx.globalCompositeOperation = 'source-over';
      const rg = ctx.createLinearGradient(0, 0, w, 0);
      rg.addColorStop(0, 'rgba(244,241,233,0.35)');
      rg.addColorStop(0.32, 'rgba(244,241,233,0.78)');
      rg.addColorStop(0.6, 'rgba(244,241,233,0.5)');
      rg.addColorStop(1, 'rgba(244,241,233,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.18, w / 2, h * 0.5, Math.max(w, h) * 0.78);
      vg.addColorStop(0, 'rgba(244,241,233,0)');
      vg.addColorStop(1, 'rgba(120,104,82,0.1)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const scrollToId = useCallback((id) => {
    const el = rootRef.current?.querySelector(`#${id}`);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 56, behavior: 'smooth' });
    setNavOpen(false);
  }, []);
  const scrollTop = useCallback(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setNavOpen(false); }, []);

  return (
    <div ref={rootRef} className="relative min-h-screen bg-transparent text-ink font-sans font-normal antialiased [overflow-x:clip]">
      {/* Fixed canvas placeholder — sits behind ALL content (z-0). */}
      <canvas ref={canvasRef} className="fixed inset-0 w-screen h-screen z-0 pointer-events-none block" />

      {/* Subtle paper grain (z-1). */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* Bottom-left ink-field status — auto-hides over the footer. */}
      {!footerVisible && (
        <div className="fixed left-0 bottom-0 z-40 pointer-events-none flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 px-[clamp(16px,3vw,28px)] py-[clamp(14px,3vw,22px)] [background:linear-gradient(105deg,rgba(244,241,233,0.82)_0%,rgba(244,241,233,0.55)_60%,rgba(244,241,233,0)_100%)]">
          <span className="w-[5px] h-[5px] rounded-full animate-statusPulse" style={{ background: ACCENT }} />
          <span>ink-field</span><span className="text-ink/30">//</span><span className="text-ink/40">fluid-sim · idle</span>
        </div>
      )}

      {/* Fixed nav. */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-[clamp(20px,5vw,64px)] py-[18px] [background:linear-gradient(180deg,rgba(244,241,233,0.86)_0%,rgba(244,241,233,0)_100%)] backdrop-blur-sm">
        <span onClick={scrollTop} className="cursor-pointer font-mono text-[12px] tracking-[0.26em] uppercase text-ink">Ethan&nbsp;Tiong<span className="text-ink/35">&nbsp;/&nbsp;EE</span></span>
        {!isMobile && (
          <nav className="flex items-center gap-[26px]">
            {NAV.map((l) => (
              <span key={l.id} onClick={() => scrollToId(l.id)} className={`cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase flex items-center gap-[7px] transition-colors hover:text-ink ${active === l.id ? 'text-ink' : 'text-ink/50'}`}>
                {active === l.id && <span className="w-[5px] h-[5px] rounded-full" style={{ background: ACCENT }} />}
                {l.label}
              </span>
            ))}
          </nav>
        )}
        {isMobile && <span onClick={() => setNavOpen((o) => !o)} className="cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink">Menu</span>}
      </header>

      {/* Mobile nav overlay. */}
      {navOpen && (
        <div className="fixed inset-0 z-[60] bg-paper/95 backdrop-blur-md flex flex-col justify-center gap-1.5 p-[clamp(28px,9vw,80px)]">
          <span onClick={() => setNavOpen(false)} className="absolute top-[22px] right-[clamp(20px,5vw,64px)] cursor-pointer font-mono text-[11.5px] tracking-[0.2em] uppercase text-ink/60">Close</span>
          {NAV.map((l) => (
            <span key={l.id} onClick={() => scrollToId(l.id)} className="cursor-pointer font-display font-bold text-[clamp(34px,9vw,60px)] leading-[1.05] text-ink">{l.label}</span>
          ))}
        </div>
      )}

      <main className="relative z-[2]">
        {/* HERO */}
        <section id="hero" className="min-h-[100svh] flex flex-col justify-between px-[clamp(20px,5vw,64px)] pt-[clamp(96px,14vh,160px)] pb-[clamp(28px,6vh,56px)]">
          <div className="animate-heroRise flex justify-between gap-5 font-mono text-[11px] tracking-[0.24em] uppercase text-ink/45">
            <span>Electrical Engineering</span>
            <span>43.4723°N · 80.5449°W</span>
          </div>
          <div className="animate-heroRise [animation-delay:0.12s] max-w-[1400px]">
            <div className="font-mono text-[clamp(11px,1.4vw,13px)] tracking-[0.3em] uppercase text-ink/50 mb-[clamp(20px,3vh,36px)]">University of Waterloo</div>
            <h1 className="font-display font-black uppercase text-[clamp(58px,17vw,260px)] leading-[0.84] tracking-[-0.02em] m-0">Ethan<br />Tiong</h1>
            <p className="font-display font-medium text-[clamp(19px,2.6vw,36px)] leading-[1.35] text-ink/[0.66] mt-[clamp(24px,4vh,44px)] max-w-[24ch]">Building systems where hardware, code, and signal meet.</p>
            <div className="mt-[clamp(18px,2.4vh,28px)] flex flex-wrap gap-3.5 items-center font-mono text-[clamp(10px,1.05vw,12px)] tracking-[0.22em] uppercase text-ink/50">
              <span>Hardware</span><Dot /><span>Firmware</span><Dot /><span>Signal</span><Dot /><span>Data</span>
            </div>
          </div>
          <div className="animate-heroRise [animation-delay:0.26s] flex items-end justify-between gap-5">
            <span onClick={() => scrollToId('about')} className="cursor-pointer flex items-center gap-3 font-mono text-[11px] tracking-[0.24em] uppercase text-ink/55"><span className="text-seal">↓</span> Scroll</span>
            <span className="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/[0.42]">Open to embedded / hardware roles</span>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]">
          <div className="max-w-[1280px] mx-auto">
            <Reveal>
              <Eyebrow no="01">Identity</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6 max-w-[16ch]">I turn invisible systems into tangible things.</h2>
            </Reveal>
            <Reveal delay={120} className="mt-[clamp(36px,6vh,64px)] max-w-[60ch]">
              <p className="text-[clamp(16px,1.7vw,21px)] leading-[1.7] text-ink/70 m-0">Signals, circuits, code, and hardware — ideas becoming real. I&rsquo;m an Electrical Engineering student who works at the seam where the electrical meets the physical: embedded firmware, board-level hardware, and the quiet, disciplined systems that sit beneath the surface and simply work.</p>
              <div className="mt-[clamp(22px,3.4vh,34px)] flex flex-wrap gap-x-[18px] gap-y-2.5 items-center font-mono text-[11px] tracking-[0.14em] uppercase text-ink/50">
                <span className="text-seal">▸</span><span>Electrical Engineering · Waterloo</span><span className="text-ink/[0.28]">/</span><span>Embedded &amp; hardware focus</span>
              </div>
            </Reveal>
            <Reveal delay={200} className="mt-[clamp(56px,9vh,110px)]">
              <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/40 mb-[clamp(24px,4vh,40px)]">Layers I work across <span className="text-ink/30">· nine tails</span></div>
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-px bg-ink/10 border border-ink/10">
                {TAILS.map((t, i) => (
                  <div key={t} className="bg-[#f7f4ec] p-[clamp(20px,3vw,32px)] flex flex-col gap-3.5 min-h-[130px]">
                    <span className="font-mono text-[12px] tracking-[0.18em] text-seal">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display font-bold text-[clamp(18px,2vw,24px)] leading-[1.15] mt-auto">{t}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* FEATURED PROJECTS */}
        <section id="work" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]">
          <div className="max-w-[1280px] mx-auto">
            <Reveal>
              <Eyebrow no="02">Featured Projects</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">Selected work.</h2>
            </Reveal>
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(24px,3vw,44px)] mt-[clamp(48px,8vh,90px)]">
              {PROJECTS.map((p) => (
                <Reveal as="article" key={p.no} className="border border-ink/[0.12] p-[clamp(24px,2.4vw,32px)] flex flex-col gap-[22px] bg-white/50 transition-colors hover:border-ink/[0.34]">
                  <div className="flex justify-between items-start font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40">
                    <span className="flex items-center gap-[9px]"><span className="text-seal">{p.no}</span><span className="text-ink/[0.22]">/</span><span className="tracking-[0.16em] text-ink/50">{p.meta}</span></span>
                    <span>{p.year}</span>
                  </div>
                  <div className="aspect-[4/3] border border-ink/[0.12] flex items-end p-3.5 [background:repeating-linear-gradient(135deg,rgba(21,17,13,0.045)_0_10px,transparent_10px_20px)]">
                    <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-ink/40">{p.img}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h3 className="font-display font-semibold text-[clamp(26px,3vw,34px)] leading-[1.05] m-0">{p.title}</h3>
                    <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/45">{p.kind}</span>
                    <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-ink/40 flex items-center gap-2 mt-0.5"><span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: ACCENT }} />{p.spec}</span>
                    <p className="text-[15px] leading-[1.6] text-ink/[0.62] mt-2">{p.blurb}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto pt-1.5">
                    {p.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink/50 border border-ink/[0.16] px-2.5 py-[5px]">{tag}</span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TECHNICAL DEEP DIVES / NOTES */}
        <section id="writing" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]">
          <div className="max-w-[1100px] mx-auto">
            <Reveal>
              <Eyebrow no="03">Technical Deep Dives</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">Notes from the bench.</h2>
            </Reveal>
            <div className="mt-[clamp(40px,7vh,72px)]">
              {NOTES.map((d) => (
                <Reveal as="article" key={d.no} className="border-t border-ink/[0.12] py-[clamp(28px,4vh,44px)] flex flex-wrap gap-[clamp(20px,4vw,56px)] items-baseline cursor-pointer transition-colors hover:bg-ink/[0.02]">
                  <span className="font-mono text-[13px] tracking-[0.18em] text-seal">{d.no}</span>
                  <div className="flex-1 min-w-[260px]">
                    <h3 className="font-display font-semibold text-[clamp(24px,3.4vw,40px)] leading-[1.08] m-0">{d.title}</h3>
                    <p className="text-[15px] leading-[1.6] text-ink/60 mt-3 max-w-[52ch]">{d.blurb}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-start font-mono text-[11px] tracking-[0.16em] uppercase text-ink/45 min-w-[120px]">
                    <span>{d.tag}</span><span className="text-ink/30">{d.read}</span>
                  </div>
                </Reveal>
              ))}
              <div className="border-t border-ink/[0.12]" />
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]">
          <div className="max-w-[1280px] mx-auto">
            <Reveal>
              <Eyebrow no="04">Skills &amp; Tools</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">Tools of the trade.</h2>
            </Reveal>
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-[clamp(28px,3vw,48px)] mt-[clamp(48px,8vh,90px)]">
              {SKILLS.map((g) => (
                <Reveal key={g.title}>
                  <h3 className="font-display font-semibold text-[clamp(20px,2.2vw,26px)] m-0 mb-5 pb-3.5 border-b border-ink/[0.16]">{g.title}</h3>
                  <ul className="list-none m-0 p-0 flex flex-col gap-3">
                    {g.items.map((it) => (
                      <li key={it} className="font-mono text-[13px] tracking-[0.04em] text-ink/[0.65]">{it}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-[clamp(96px,16vh,200px)]">
          <div className="max-w-[1100px] mx-auto">
            <Reveal>
              <Eyebrow no="05">Experience</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(38px,6.4vw,96px)] leading-[1.02] tracking-[-0.015em] mt-6">Where I&rsquo;ve been.</h2>
            </Reveal>
            <div className="mt-[clamp(40px,7vh,72px)]">
              {EXPERIENCE.map((x) => (
                <Reveal as="article" key={x.period} className="border-t border-ink/[0.12] py-[clamp(28px,4vh,44px)] flex flex-wrap gap-[clamp(16px,4vw,56px)]">
                  <span className="basis-[160px] shrink-0 font-mono text-[12px] tracking-[0.16em] uppercase text-ink/45 pt-1.5">{x.period}</span>
                  <div className="flex-1 min-w-[280px]">
                    <h3 className="font-display font-semibold text-[clamp(24px,3.2vw,38px)] leading-[1.08] m-0">{x.role}</h3>
                    <span className="block font-mono text-[12px] tracking-[0.12em] uppercase text-seal mt-2">{x.org}</span>
                    <p className="text-[15px] leading-[1.65] text-ink/[0.62] mt-3.5 max-w-[54ch]">{x.blurb}</p>
                  </div>
                </Reveal>
              ))}
              <div className="border-t border-ink/[0.12]" />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] pt-[clamp(110px,20vh,260px)] pb-[clamp(60px,10vh,120px)]">
          <div className="max-w-[1280px] mx-auto">
            <Reveal>
              <Eyebrow no="06">Contact</Eyebrow>
              <h2 className="font-display font-black text-[clamp(46px,9vw,150px)] leading-[0.98] tracking-[-0.02em] mt-7">Let&rsquo;s build<br />something real.</h2>
            </Reveal>
            <Reveal delay={140} className="mt-[clamp(44px,7vh,80px)] flex flex-wrap gap-[clamp(28px,6vw,80px)] items-end justify-between">
              <a href="mailto:hello@ethantiong.dev" className="font-display italic font-medium text-[clamp(24px,4vw,46px)] text-ink no-underline border-b border-ink/30 pb-1.5 transition-colors hover:border-seal">hello@ethantiong.dev</a>
              <div className="flex flex-wrap gap-6 font-mono text-[12px] tracking-[0.16em] uppercase">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} className="text-ink/60 no-underline transition-colors hover:text-ink">{s.label}</a>
                ))}
              </div>
            </Reveal>
            {/* Maker's mark — intentional in-flow seal, not a floating sticker. */}
            <Reveal delay={220} className="mt-[clamp(52px,9vh,100px)] pt-[clamp(22px,3vh,32px)] border-t border-ink/[0.12] flex items-center justify-end gap-[18px]">
              <div className="text-right font-mono text-[10.5px] tracking-[0.2em] uppercase leading-[1.7] text-ink/45">
                <div>Maker&rsquo;s mark</div>
                <div className="text-ink/[0.32]">九尾 · nine tails</div>
              </div>
              <div className="shrink-0 w-[clamp(48px,5.5vw,60px)] h-[clamp(48px,5.5vw,60px)] border-[1.5px] border-seal rounded-lg flex items-center justify-center -rotate-3 [box-shadow:inset_0_0_0_3px_rgba(244,241,233,0.7)]">
                <span className="font-display font-semibold text-[clamp(26px,3vw,32px)] leading-none text-seal">九</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-8 flex flex-wrap gap-4 justify-between items-center font-mono text-[11px] tracking-[0.18em] uppercase text-ink/40">
          <span>Ethan Tiong — Electrical Engineering, Waterloo</span>
          <span onClick={scrollTop} className="cursor-pointer">↑ Back to top</span>
          <span className="flex items-center gap-[9px]"><span className="text-seal">九</span>© 2026 · Built in ink</span>
        </footer>
      </main>
    </div>
  );
}

const Dot = () => <span className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />;
