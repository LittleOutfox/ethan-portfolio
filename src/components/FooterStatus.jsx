export default function FooterStatus({ footerVisible, onScrollTop }) {
  return (
    <>
      {/* Always mounted; fades out (rather than popping) as the footer nears
          so it never visually collides with the contact seal. */}
      <div
        aria-hidden="true"
        className={`fixed left-0 bottom-0 z-40 pointer-events-none flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 px-[clamp(16px,3vw,28px)] py-[clamp(14px,3vw,22px)] [background:linear-gradient(105deg,rgba(244,241,233,0.82)_0%,rgba(244,241,233,0.55)_60%,rgba(244,241,233,0)_100%)] transition-opacity duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
          footerVisible ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="w-[5px] h-[5px] rounded-full bg-seal animate-statusPulse" />
        <span>ink-field</span>
        <span className="text-ink/30">{'//'}</span>
        <span className="text-ink/40">fluid-sim · idle</span>
      </div>

      <footer className="border-t border-ink/10 px-[clamp(20px,5vw,64px)] py-8 flex flex-wrap gap-4 justify-between items-center font-mono text-[11px] tracking-[0.18em] uppercase text-ink/40">
        <span>Ethan Tiong — Electrical Engineering, Waterloo</span>
        <button
          type="button"
          onClick={onScrollTop}
          className="relative inline-block cursor-pointer transition-colors duration-300 hover:text-ink after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:bg-ink after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-[cubic-bezier(.2,.7,.2,1)] hover:after:scale-x-100"
        >
          ↑ Back to top
        </button>
        <span className="flex items-center gap-[9px]">
          <span className="text-seal">九</span>© 2026 · Built in ink
        </span>
      </footer>
    </>
  );
}
