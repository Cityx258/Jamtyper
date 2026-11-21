export type LyricLine = { at: number; text: string };

export type Lyrics = { synced: true; lines: LyricLine[] } | { synced: false; lines: string[] };

const STAMPS = /^(?:\s*\[\d+:\d+(?:[.:]\d+)?\])+/;
const STAMP = /\[(\d+):(\d+)(?:[.:](\d+))?\]/g;
const META = /^\s*\[([a-z#]+):(.*)\]\s*$/i;
const WORD_STAMP = /<\d+:\d+(?:[.:]\d+)?>/g;

function seconds(min: string, sec: string, frac: string | undefined): number {
  return Number(min) * 60 + Number(sec) + (frac ? Number(`0.${frac}`) : 0);
}

export function parseLyrics(raw: string | null): Lyrics | null {
  if (!raw) return null;
  const rows = raw.replace(/\r\n?/g, "\n").split("\n");
  const timed: LyricLine[] = [];
  const plain: string[] = [];
  let offset = 0;
  for (const row of rows) {
    const stamps = STAMPS.exec(row);
    if (stamps) {
      const text = row.slice(stamps[0].length).replace(WORD_STAMP, "").trim();
      for (const m of stamps[0].matchAll(STAMP)) timed.push({ at: seconds(m[1], m[2], m[3]), text });
      continue;
    }
    const meta = META.exec(row);
    if (meta) {
      if (meta[1].toLowerCase() === "offset") offset = Number(meta[2]) / 1000 || 0;
      continue;
    }
    plain.push(row.trim());
  }
  if (timed.some((l) => l.text)) {
    const lines = timed.map((l) => ({ at: Math.max(0, l.at - offset), text: l.text })).sort((a, b) => a.at - b.at);
    while (lines.length > 0 && !lines[lines.length - 1].text) lines.pop();
    return { synced: true, lines };
  }
  while (plain.length > 0 && !plain[0]) plain.shift();
  while (plain.length > 0 && !plain[plain.length - 1]) plain.pop();
  const lines = plain.filter((l, i) => l || plain[i - 1]);
  return lines.length > 0 ? { synced: false, lines } : null;
}

export function lineAt(lines: LyricLine[], time: number): number {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].at <= time) {
      found = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return found;
}
