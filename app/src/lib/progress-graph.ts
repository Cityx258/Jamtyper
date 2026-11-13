export type RacePoint = { at: number; wpm: number };
export type DayPoint = { day: string; at: number; wpm: number; races: number };

export function localDay(at: number, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function dailyAverages(points: RacePoint[], dayOf: (at: number) => string): DayPoint[] {
  const days = new Map<string, { at: number; wpm: number; races: number }>();
  for (const p of points) {
    const key = dayOf(p.at);
    const d = days.get(key) ?? { at: 0, wpm: 0, races: 0 };
    d.at += p.at;
    d.wpm += p.wpm;
    d.races++;
    days.set(key, d);
  }
  return [...days.entries()]
    .map(([day, d]) => ({ day, at: d.at / d.races, wpm: d.wpm / d.races, races: d.races }))
    .sort((a, b) => a.at - b.at);
}

export function timeTicks(from: number, to: number, most: number): number[] {
  if (to <= from) return [from];
  const step = (to - from) / Math.max(1, most - 1);
  return Array.from({ length: most }, (_, i) => from + i * step);
}
