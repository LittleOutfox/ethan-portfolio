export default function Eyebrow({ no, children }) {
  return (
    <div className="flex items-center gap-3.5 font-mono text-[12px] tracking-[0.28em] uppercase text-ink/45">
      <span className="text-seal">{no}</span>
      <span className="w-10 h-px bg-ink/25" />
      <span>{children}</span>
    </div>
  );
}
