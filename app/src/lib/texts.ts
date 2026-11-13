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

function random(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] + 1) / 0x1_0000_0001;
}

interface CharRules {
  banned: Set<string>;
  favored: Set<string>;
}

const charSet = (chars: string) =>
  new Set([...chars].map((c) => c.toLowerCase()));

function hits(text: string, set: Set<string>): number {
  if (set.size === 0) return 0;
  let n = 0;
  for (const c of text.toLowerCase()) if (set.has(c)) n++;
  return n;
}

const allowed = (text: string, rules: CharRules) => hits(text, rules.banned) === 0;

function weightedOrder<T>(items: T[], weight: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: -Math.log(random()) / weight(item) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

function randomWords(pool: string[], count: number, rules: CharRules): string[] {
  const weights = pool.map((w) => 1 + 3 * hits(w, rules.favored));
  const total = weights.reduce((a, b) => a + b, 0);
  const pickOne = () => {
    let r = random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };
  const words: string[] = [];
  while (words.length < count) {
    const word = pickOne();
    if (pool.length === 1 || word !== words[words.length - 1]) words.push(word);
  }
  return words;
}

const stripAccents = (word: string) =>
  word.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");

const ENDINGS = [".", ".", ".", "!", "?"];

function byDifficulty(pool: string[], s: RaceSettings): string[] {
  if (s.difficulty !== "easy") return pool;
  const simple = pool.filter((w) =>
    isCodeLanguage(s.language) ? /^[a-z]+$/i.test(w) : [...w].length <= 5,
  );
  return simple.length >= 5 ? simple : pool;
}

const SYMBOLS: ((w: string) => string)[] = [
  (w) => `(${w})`,
  (w) => `"${w}"`,
  (w) => `[${w}]`,
  (w) => `${w};`,
  (w) => `${w}:`,
  (w) => `#${w}`,
  (w) => `@${w}`,
  (w) => `${w}&`,
  (w) => `${w}/`,
  (w) => `${w}*`,
];

function harden(words: string[], rules: CharRules): string[] {
  return words.map((w) => {
    const roll = randomInt(20);
    let out = w;
    if (roll < 2) out = String(randomInt(10_000));
    else if (roll < 5) out = SYMBOLS[randomInt(SYMBOLS.length)](w);
    else if (roll < 7) out = w[0].toUpperCase() + w.slice(1);
    return allowed(out, rules) ? out : w;
  });
}

function punctuate(words: string[], rules: CharRules): string[] {
  const endings = ENDINGS.filter((e) => allowed(e, rules));
  const commas = allowed(",", rules);
  let sentence = 0;
  let target = 4 + randomInt(7);
  return words.map((word, i) => {
    let w = sentence === 0 ? word[0].toUpperCase() + word.slice(1) : word;
    sentence++;
    if (i === words.length - 1 || sentence >= target) {
      if (endings.length) w += endings[randomInt(endings.length)];
      sentence = 0;
      target = 4 + randomInt(7);
    } else if (commas && randomInt(6) === 0) {
      w += ",";
    }
    return w;
  });
}

function wordsText(s: RaceSettings, rules: CharRules): string | null {
  const natural = !isCodeLanguage(s.language);
  let pool = byDifficulty(wordPool(s), s);
  if (natural && !s.accents) pool = [...new Set(pool.map(stripAccents))];
  pool = pool.filter((w) => allowed(w, rules));
  if (pool.length === 0) return null;
  let words = randomWords(pool, s.length, rules);
  if (s.difficulty === "hard") words = harden(words, rules);
  if (natural && s.punctuation) words = punctuate(words, rules);
  return words.join(" ");
}

function chainQuotes(
  pool: Quote[],
  targetWords: number,
  rules: CharRules,
): GeneratedText | null {
  const usable = pool
    .map((q) => ({ ...q, text: typeable(q.text) }))
    .filter((q) => allowed(q.text, rules));
  const ordered = weightedOrder(
    usable,
    (q) => 1 + (30 * hits(q.text, rules.favored)) / q.text.length,
  );
  const picked: Quote[] = [];
  let words = 0;
  for (const q of ordered) {
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
  const rules: CharRules = {
    banned: charSet(s.blacklist),
    favored: charSet(s.priority),
  };
  let out: GeneratedText | null;
  if (s.source === "custom") {
    out = s.customText ? { text: s.customText, by: null } : null;
  } else if (s.source === "quote") {
    out = chainQuotes(quotePool(s), s.length, rules);
  } else {
    const text = wordsText(s, rules);
    out = text ? { text, by: null } : null;
  }
  if (!out) return null;
  const text = typeable(out.text);
  return text ? { text, by: out.by } : null;
}
