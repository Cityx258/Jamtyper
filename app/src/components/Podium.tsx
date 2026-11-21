import NoteIcon from "@/components/NoteIcon";
import { isSinger } from "@/lib/notes";
import type { Dict } from "@/i18n/en";
import type { RacerView } from "@/lib/room-protocol";

const STEPS = [
  { place: 2, height: "h-20 sm:h-24" },
  { place: 1, height: "h-28 sm:h-36" },
  { place: 3, height: "h-14 sm:h-16" },
];

export function podiumRacers(racers: RacerView[]): RacerView[] {
  return racers
    .filter((r) => r.place !== null && r.place <= 3 && (r.outcome === "finished" || r.outcome === "timed_out"))
    .sort((a, b) => a.place! - b.place!);
}

export default function Podium({
  racers,
  you,
  t,
}: {
  racers: RacerView[];
  you: string | null;
  t: Dict["room"];
}) {
  const top = podiumRacers(racers);
  if (top.length === 0) return null;
  return (
    <ol
      aria-label={t.podium}
      className="mx-auto mt-8 grid max-w-xl grid-cols-3 items-end gap-2 sm:gap-4"
    >
      {STEPS.map(({ place, height }) => {
        const r = top.find((x) => x.place === place);
        return (
          <li
            key={place}
            value={place}
            className={`flex flex-col items-center ${place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3"}`}
          >
            {r && (
              <>
                <span
                  className={`inline-flex origin-bottom ${
                    place === 1 ? (isSinger(r.note) ? "winner-dance" : "winner-sway") : ""
                  }`}
                >
                  <NoteIcon
                    note={r.note}
                    size={place === 1 ? 48 : 36}
                    className="text-teal"
                  />
                </span>
                <p
                  className={`mt-2 w-full truncate text-center font-medium ${r.id === you ? "text-teal" : ""}`}
                >
                  {r.name}
                  {r.isBot && <span className="text-muted"> ({t.bot})</span>}
                </p>
                <p className="font-mono text-sm text-muted">
                  {r.wpm} {t.wpm}
                </p>
              </>
            )}
            <div
              className={`mt-3 flex w-full items-start justify-center rounded-t-3xl border border-b-0 pt-2 font-display text-2xl sm:text-3xl ${height} ${
                place === 1 ? "border-teal bg-gradient-to-b from-teal/30 to-teal/5 text-ink" : "border-line bg-gradient-to-b from-raised to-raised/30 text-muted"
              }`}
            >
              <span className="sr-only">{t.place} </span>
              {place}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
