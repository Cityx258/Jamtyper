import { NOTES, type NoteKind } from "@/lib/notes";

const FLAG = (y: number) =>
  `M16 ${y} C 18 ${y + 6}, 26 ${y + 8}, 24 ${y + 16} C 23 ${y + 11}, 19 ${y + 10}, 16 ${y + 9} Z`;

export default function NoteIcon({
  note,
  size = 20,
  className = "",
  label,
}: {
  note: NoteKind;
  size?: number;
  className?: string;
  label?: string;
}) {
  const rank = NOTES.indexOf(note);
  const hollow = rank <= 1;
  const flags = Math.max(0, rank - 2);
  return (
    <svg
      viewBox="0 0 28 40"
      width={size * 0.7}
      height={size}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className}`}
    >
      {note === "whole" ? (
        <ellipse
          cx="14"
          cy="27"
          rx="10.5"
          ry="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          transform="rotate(-18 14 27)"
        />
      ) : (
        <>
          <ellipse
            cx="9"
            cy="33"
            rx={hollow ? 6 : 7}
            ry={hollow ? 4.2 : 5}
            fill={hollow ? "none" : "currentColor"}
            stroke={hollow ? "currentColor" : "none"}
            strokeWidth={hollow ? 2.4 : 0}
            transform="rotate(-22 9 33)"
          />
          <rect x="14.2" y="2" width="2" height="31" rx="1" />
          {Array.from({ length: flags }, (_, i) => (
            <path key={i} d={FLAG(2 + i * 6)} />
          ))}
        </>
      )}
    </svg>
  );
}
