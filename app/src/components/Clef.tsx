// Treble clef (clef de sol) from the Noto Music font. The glyph is sized in
// multiples of the staff gap so it always lines up with a .staff of the same gap.
export default function Clef({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`select-none font-music leading-none text-teal ${className}`}
      style={{ fontSize: "calc(var(--staff-gap) * 8.2)" }}
    >
      {"\u{1D11E}"}
    </span>
  );
}
