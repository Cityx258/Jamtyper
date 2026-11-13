import NoteIcon from "@/components/NoteIcon";
import type { NoteKind } from "@/lib/notes";

type Tone = "you" | "other" | "out";

type Props = {
  progress: number;
  length: number;
  note: NoteKind;
  pitch: number;
  tone: Tone;
  label: string;
};

const GAP = 9;
const TOP = 24;
const STAFF = GAP * 4;
const HEIGHT = TOP + STAFF + 16;
const CLEF = 40;
const END = 14;
const SIZE = 34;
const BARS = 4;

const COLORS: Record<Tone, string> = {
  you: "text-teal",
  other: "text-ink",
  out: "text-muted opacity-60",
};

const track = (fraction: number) =>
  `calc(${CLEF}px + (100% - ${CLEF + END}px) * ${fraction})`;

export default function StaffLane({ progress, length, note, pitch, tone, label }: Props) {
  const fraction = length > 0 ? Math.min(1, progress / length) : 0;
  const headX = (note === "whole" ? 14 : 9) * ((SIZE * 0.7) / 28);
  const headY = ((note === "whole" ? 27 : 33) * SIZE) / 40;
  const y = TOP + STAFF - (pitch * GAP) / 2;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={length}
      aria-valuenow={progress}
      className="relative w-full"
      style={{ height: HEIGHT }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute inset-x-0 h-px bg-muted/55"
          style={{ top: TOP + i * GAP }}
        />
      ))}
      <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={CLEF} height={HEIGHT}>
        <text
          x={2}
          y={TOP + STAFF}
          className="select-none fill-muted font-music"
          style={{ fontSize: GAP * 4.3 }}
        >
          {"\u{1D11E}"}
        </text>
      </svg>
      {Array.from({ length: BARS - 1 }, (_, i) => (
        <span
          key={i}
          className="absolute w-px bg-muted/55"
          style={{ top: TOP, height: STAFF, left: track((i + 1) / BARS) }}
        />
      ))}
      <span className="absolute right-[3px] w-px bg-muted/60" style={{ top: TOP, height: STAFF }} />
      <span className="absolute right-0 w-[2px] bg-muted/80" style={{ top: TOP, height: STAFF }} />
      <span
        className={`absolute transition-[left] duration-200 ease-out ${COLORS[tone]}`}
        style={{ left: track(fraction), top: y - headY, marginLeft: -headX }}
      >
        <NoteIcon note={note} size={SIZE} />
      </span>
    </div>
  );
}
