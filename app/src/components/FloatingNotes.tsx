import type { CSSProperties } from "react";

type Glyph = "quarter" | "eighth" | "beamed";

type NoteSpec = {
  glyph: Glyph;
  left: number; // % from the left edge
  size: number; // px height of the glyph
  dur: number; // seconds for one rise
  delay: number; // negative so the page is already populated on load
  sway: number; // px of horizontal drift at mid-flight
  alpha: number;
  tiltA: number;
  tiltB: number;
  restTop: number; // % used when motion is reduced
  tone: "teal" | "bright" | "deep";
};

// Hand-placed rather than random so server and client render the same markup.
const NOTES: NoteSpec[] = [
  { glyph: "eighth", left: 6, size: 44, dur: 26, delay: -4, sway: 40, alpha: 0.55, tiltA: -12, tiltB: 10, restTop: 62, tone: "teal" },
  { glyph: "quarter", left: 14, size: 30, dur: 34, delay: -20, sway: -30, alpha: 0.3, tiltA: 8, tiltB: -8, restTop: 24, tone: "deep" },
  { glyph: "beamed", left: 22, size: 52, dur: 30, delay: -11, sway: 55, alpha: 0.5, tiltA: -6, tiltB: 14, restTop: 78, tone: "bright" },
  { glyph: "quarter", left: 31, size: 36, dur: 38, delay: -29, sway: -45, alpha: 0.4, tiltA: 14, tiltB: -10, restTop: 40, tone: "teal" },
  { glyph: "eighth", left: 39, size: 26, dur: 28, delay: -7, sway: 30, alpha: 0.3, tiltA: -9, tiltB: 9, restTop: 14, tone: "deep" },
  { glyph: "beamed", left: 47, size: 40, dur: 36, delay: -24, sway: -50, alpha: 0.45, tiltA: 5, tiltB: -12, restTop: 70, tone: "teal" },
  { glyph: "quarter", left: 55, size: 48, dur: 32, delay: -15, sway: 35, alpha: 0.55, tiltA: -14, tiltB: 6, restTop: 32, tone: "bright" },
  { glyph: "eighth", left: 63, size: 34, dur: 40, delay: -33, sway: -25, alpha: 0.35, tiltA: 10, tiltB: -14, restTop: 86, tone: "teal" },
  { glyph: "beamed", left: 71, size: 56, dur: 29, delay: -2, sway: 60, alpha: 0.5, tiltA: -8, tiltB: 12, restTop: 18, tone: "deep" },
  { glyph: "quarter", left: 79, size: 28, dur: 35, delay: -18, sway: -35, alpha: 0.4, tiltA: 12, tiltB: -6, restTop: 54, tone: "teal" },
  { glyph: "eighth", left: 86, size: 46, dur: 31, delay: -26, sway: 45, alpha: 0.55, tiltA: -10, tiltB: 8, restTop: 8, tone: "bright" },
  { glyph: "quarter", left: 93, size: 38, dur: 37, delay: -9, sway: -40, alpha: 0.35, tiltA: 6, tiltB: -12, restTop: 66, tone: "deep" },
];

const TONES = {
  teal: "var(--teal)",
  bright: "var(--teal-bright)",
  deep: "var(--teal-deep)",
};

// Heads are slightly slanted ellipses, stems are plain strokes: reads as sheet music.
function NoteShape({ glyph }: { glyph: Glyph }) {
  if (glyph === "quarter") {
    return (
      <>
        <ellipse cx="9" cy="33" rx="7" ry="5" transform="rotate(-22 9 33)" />
        <rect x="14.2" y="4" width="2" height="29" rx="1" />
      </>
    );
  }
  if (glyph === "eighth") {
    return (
      <>
        <ellipse cx="9" cy="33" rx="7" ry="5" transform="rotate(-22 9 33)" />
        <rect x="14.2" y="4" width="2" height="29" rx="1" />
        <path d="M16 4 C 18 12, 27 14, 25 25 C 24 19, 19 17, 16 16 Z" />
      </>
    );
  }
  return (
    <>
      <ellipse cx="9" cy="33" rx="7" ry="5" transform="rotate(-22 9 33)" />
      <ellipse cx="31" cy="29" rx="7" ry="5" transform="rotate(-22 31 29)" />
      <rect x="14.2" y="6" width="2" height="27" rx="1" />
      <rect x="36.2" y="2" width="2" height="27" rx="1" />
      <path d="M14.2 5 L38.2 1 L38.2 8 L14.2 12 Z" />
    </>
  );
}

export default function FloatingNotes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {NOTES.map((n, i) => {
        const style = {
          left: `${n.left}%`,
          "--dur": `${n.dur}s`,
          "--delay": `${n.delay}s`,
          "--sway": `${n.sway}px`,
          "--alpha": n.alpha,
          "--tilt-a": `${n.tiltA}deg`,
          "--tilt-b": `${n.tiltB}deg`,
          "--rest-top": `${n.restTop}%`,
          color: TONES[n.tone],
        } as CSSProperties;
        return (
          <svg
            key={i}
            className="note"
            style={style}
            height={n.size}
            width={n.glyph === "beamed" ? n.size * 1.1 : n.size * 0.7}
            viewBox={n.glyph === "beamed" ? "0 0 44 40" : "0 0 28 40"}
            fill="currentColor"
          >
            <NoteShape glyph={n.glyph} />
          </svg>
        );
      })}
    </div>
  );
}
