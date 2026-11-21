import { isCodeLanguage, type Difficulty, type Language, type RaceSettings, type TextTheme } from "./race-settings";
import { CODE_WORDS, THEMED_WORDS } from "./text/words";

export interface Passage {
  language: Language;
  theme: TextTheme | null;
  text: string;
  by: string | null;
}

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

const bare = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const sameWord = (a: string, b: string) => bare(a) !== "" && bare(a) === bare(b);

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
    if (pool.length === 1 || !sameWord(word, words[words.length - 1] ?? "")) words.push(word);
  }
  return words;
}

const stripAccents = (word: string) =>
  word.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");

const ENDINGS = [".", ".", ".", "!", "?"];

export const WORD_LETTERS: Record<Difficulty, number> = { easy: 5, medium: 8, hard: Infinity };

function byDifficulty(pool: string[], s: RaceSettings): string[] {
  const limit = WORD_LETTERS[s.difficulty];
  const fits = pool.filter((w) =>
    isCodeLanguage(s.language)
      ? s.difficulty !== "easy" || /^[a-z]+$/i.test(w)
      : [...w].length <= limit,
  );
  return fits.length >= 5 ? fits : pool;
}

export function complexity(text: string): number {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return 0;
  const letters = words.reduce((n, w) => n + w.replace(/[^\p{L}]/gu, "").length, 0);
  const special = [...text].filter((c) => !/[\p{L} ]/u.test(c)).length;
  return letters / words.length + (10 * special) / text.length;
}

export const COMPLEXITY_BANDS: Record<Difficulty, [number, number]> = {
  easy: [0, 4.3],
  medium: [4.3, 5],
  hard: [5, Infinity],
};

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
    if (randomInt(5) !== 0) return w;
    const out = SYMBOLS[randomInt(SYMBOLS.length)](w);
    return allowed(out, rules) ? out : w;
  });
}

const capitalize = (w: string) => w[0].toUpperCase() + w.slice(1);

function addNumbers(words: string[], rules: CharRules): string[] {
  const out: string[] = [];
  words.forEach((w, i) => {
    const n = String(randomInt(10 ** (1 + randomInt(4))));
    const fits = randomInt(8) === 0 && allowed(n, rules) && !sameWord(n, out[i - 1] ?? "") && !sameWord(n, words[i + 1] ?? "");
    out.push(fits ? n : w);
  });
  return out;
}

function addCapitals(words: string[], rules: CharRules): string[] {
  return words.map((w) => {
    if (randomInt(6) !== 0) return w;
    const out = capitalize(w);
    return allowed(out, rules) ? out : w;
  });
}

function punctuate(words: string[], rules: CharRules, capitals: boolean): string[] {
  const endings = ENDINGS.filter((e) => allowed(e, rules));
  const commas = allowed(",", rules);
  let sentence = 0;
  let target = 4 + randomInt(7);
  return words.map((word, i) => {
    let w = sentence === 0 && capitals && allowed(capitalize(word), rules) ? capitalize(word) : word;
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
  if (natural && s.numbers) words = addNumbers(words, rules);
  if (natural && s.capitals) words = addCapitals(words, rules);
  if (natural && s.punctuation) words = punctuate(words, rules, s.capitals);
  return words.join(" ");
}

export function adaptPassage(text: string, s: RaceSettings): string | null {
  if (isCodeLanguage(s.language)) return text;
  if (!s.numbers && /\d/.test(text)) return null;
  let out = text;
  if (!s.punctuation) out = out.replace(/[.,;:!?"()[\]]/g, "").replace(/ - /g, " ");
  if (!s.capitals) out = out.toLowerCase();
  if (!s.accents) out = stripAccents(out);
  out = typeable(out);
  return out || null;
}

function chainQuotes(
  pool: Passage[],
  s: RaceSettings,
  rules: CharRules,
): GeneratedText | null {
  const usable = pool.flatMap((q) => {
    const original = typeable(q.text);
    const text = adaptPassage(original, s);
    return text && allowed(text, rules) ? [{ ...q, text, score: complexity(original) }] : [];
  });
  const [low, high] = COMPLEXITY_BANDS[s.difficulty];
  const inBand = usable.filter((q) => q.score >= low && q.score < high);
  const ordered = weightedOrder(
    inBand.length ? inBand : usable,
    (q) => 1 + (30 * hits(q.text, rules.favored)) / q.text.length,
  );
  const picked: Passage[] = [];
  let words = 0;
  for (const q of ordered) {
    picked.push(q);
    words += q.text.split(" ").length;
    if (words >= s.length) break;
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

function quotePool(s: RaceSettings, passages: Passage[]): Passage[] {
  const all = passages.filter((p) => p.language === s.language);
  if (isCodeLanguage(s.language) || s.theme === "general") return all;
  const theme = s.theme === "vocaloid" ? "music" : s.theme;
  return all.filter((q) => q.theme === theme);
}

export function generateText(s: RaceSettings, passages: Passage[] = []): GeneratedText | null {
  const rules: CharRules = {
    banned: charSet(s.blacklist),
    favored: charSet(s.priority),
  };
  let out: GeneratedText | null;
  if (s.source === "custom") {
    out = s.customText ? { text: s.customText, by: null } : null;
  } else if (s.source === "quote") {
    out = chainQuotes(quotePool(s, passages), s, rules);
  } else {
    const text = wordsText(s, rules);
    out = text ? { text, by: null } : null;
  }
  if (!out) return null;
  const text = typeable(out.text);
  return text ? { text, by: out.by } : null;
}
