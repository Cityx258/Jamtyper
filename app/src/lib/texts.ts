import type { RaceSettings } from "./race-settings";
import { QUOTES, type Quote } from "./text/quotes";
import { WORDS } from "./text/words";

export interface GeneratedText {
  text: string;
  by: string | null;
}

const TYPEABLE: [RegExp, string][] = [
  [/œ/g, "oe"],
  [/Œ/g, "Oe"],
  [/æ/g, "ae"],
  [/Æ/g, "Ae"],
  [/[‘’]/g, "'"],
  [/[“”«»]/g, '"'],
  [/[–—]/g, "-"],
  [/…/g, "..."],
];

export function typeable(raw: string): string {
  let s = raw.normalize("NFC");
  for (const [from, to] of TYPEABLE) s = s.replace(from, to);
  return s
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function randomWords(pool: string[], count: number): string {
  const words: string[] = [];
  while (words.length < count) {
    const word = pool[randomInt(pool.length)];
    if (pool.length === 1 || word !== words[words.length - 1]) words.push(word);
  }
  return words.join(" ");
}

function chainQuotes(pool: Quote[], targetWords: number): GeneratedText | null {
  const picked: Quote[] = [];
  let words = 0;
  for (const q of shuffle([...pool])) {
    picked.push(q);
    words += q.text.split(" ").length;
    if (words >= targetWords) break;
  }
  if (picked.length === 0) return null;
  const authors = [...new Set(picked.flatMap((q) => (q.by ? [q.by] : [])))];
  return {
    text: picked.map((q) => q.text).join(" "),
    by: authors.length ? authors.join(", ") : null,
  };
}

export function generateText(s: RaceSettings): GeneratedText | null {
  let out: GeneratedText | null;
  if (s.source === "custom") {
    out = s.customText ? { text: s.customText, by: null } : null;
  } else if (s.source === "quote") {
    out = chainQuotes(QUOTES[s.language], s.length);
  } else {
    out = { text: randomWords(WORDS[s.language], s.length), by: null };
  }
  if (!out) return null;
  const text = typeable(out.text);
  return text ? { text, by: out.by } : null;
}
