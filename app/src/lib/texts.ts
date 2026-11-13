import { isCodeLanguage, type RaceSettings } from "./race-settings";
import { QUOTES, type Quote } from "./text/quotes";
import { CODE_WORDS, THEMED_WORDS } from "./text/words";

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

function randomWords(pool: string[], count: number): string[] {
  const words: string[] = [];
  while (words.length < count) {
    const word = pool[randomInt(pool.length)];
    if (pool.length === 1 || word !== words[words.length - 1]) words.push(word);
  }
  return words;
}

const stripAccents = (word: string) =>
  word.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");

const ENDINGS = [".", ".", ".", "!", "?"];

function punctuate(words: string[]): string[] {
  let sentence = 0;
  let target = 4 + randomInt(7);
  return words.map((word, i) => {
    let w = sentence === 0 ? word[0].toUpperCase() + word.slice(1) : word;
    sentence++;
    if (i === words.length - 1 || sentence >= target) {
      w += ENDINGS[randomInt(ENDINGS.length)];
      sentence = 0;
      target = 4 + randomInt(7);
    } else if (randomInt(6) === 0) {
      w += ",";
    }
    return w;
  });
}

function wordsText(s: RaceSettings): string {
  let words = randomWords(wordPool(s), s.length);
  if (!isCodeLanguage(s.language)) {
    if (!s.accents) words = words.map(stripAccents);
    if (s.punctuation) words = punctuate(words);
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

function wordPool(s: RaceSettings): string[] {
  return isCodeLanguage(s.language)
    ? CODE_WORDS[s.language]
    : THEMED_WORDS[s.language][s.theme];
}

function quotePool(s: RaceSettings): Quote[] {
  const all = QUOTES[s.language];
  if (isCodeLanguage(s.language) || s.theme === "general") return all;
  return all.filter((q) => q.theme === s.theme);
}

export function generateText(s: RaceSettings): GeneratedText | null {
  let out: GeneratedText | null;
  if (s.source === "custom") {
    out = s.customText ? { text: s.customText, by: null } : null;
  } else if (s.source === "quote") {
    out = chainQuotes(quotePool(s), s.length);
  } else {
    out = { text: wordsText(s), by: null };
  }
  if (!out) return null;
  const text = typeable(out.text);
  return text ? { text, by: out.by } : null;
}
