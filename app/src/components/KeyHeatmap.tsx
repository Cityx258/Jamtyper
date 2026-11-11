import type { MissedKeys } from "@/lib/room-protocol";

type Props = {
  missed: MissedKeys;
  t: {
    empty: string;
    space: string;
    other: string;
    less: string;
    more: string;
    missedTimes: string;
  };
};

const ROWS = [
  [..."1234567890-="],
  [..."qwertyuiop[]"],
  [..."asdfghjkl;'"],
  [..."zxcvbnm,./"],
];
const ROW_OFFSET = ["0", "0.75rem", "1.5rem", "2.5rem"];
const LAYOUT = new Set([...ROWS.flat(), " "]);

function heat(count: number, max: number) {
  if (!count) return undefined;
  const pct = Math.round(18 + (count / max) * 72);
  return `color-mix(in oklab, var(--danger) ${pct}%, transparent)`;
}

function Key({
  label,
  n,
  max,
  title,
  wide,
}: {
  label: string;
  n: number;
  max: number;
  title: string;
  wide?: boolean;
}) {
  return (
    <div
      title={n ? title.replace("{n}", String(n)) : undefined}
      className={`grid h-9 place-items-center rounded-md border border-line font-mono text-xs uppercase sm:h-11 sm:text-sm ${
        wide ? "w-1/2 sm:w-64" : "min-w-0 flex-1 sm:w-11 sm:flex-none"
      } ${n ? "text-ink" : "text-muted"}`}
      style={{ background: heat(n, max) }}
    >
      {label}
      {n > 0 && <span className="sr-only">: {n}</span>}
    </div>
  );
}

export default function KeyHeatmap({ missed, t }: Props) {
  const counts = new Map<string, number>();
  for (const [key, n] of Object.entries(missed)) {
    const k = key.toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + n);
  }
  const max = Math.max(0, ...counts.values());
  const others = [...counts].filter(([k]) => !LAYOUT.has(k)).sort((a, b) => b[1] - a[1]);

  if (max === 0) return <p className="text-muted">{t.empty}</p>;

  return (
    <div>
      <div className="space-y-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: ROW_OFFSET[i] }}>
            {row.map((k) => (
              <Key
                key={k}
                label={k}
                n={counts.get(k) ?? 0}
                max={max}
                title={t.missedTimes}
              />
            ))}
          </div>
        ))}
        <div className="flex justify-center pr-12">
          <Key
            label={t.space}
            n={counts.get(" ") ?? 0}
            max={max}
            title={t.missedTimes}
            wide
          />
        </div>
      </div>

      {others.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          {t.other}{" "}
          {others.map(([k, n]) => (
            <span key={k} className="mr-3 font-mono text-ink">
              {k} <span className="text-danger">×{n}</span>
            </span>
          ))}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted">
        {t.less}
        <span
          className="h-2 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(to right, color-mix(in oklab, var(--danger) 18%, transparent), var(--danger))",
          }}
        />
        {t.more}
      </div>
    </div>
  );
}
