import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, type RaceSettings } from "../src/lib/race-settings";
import { QUOTES } from "../src/db/seed/passages";
import { LANGUAGES } from "../src/lib/race-settings";
import {
  adaptPassage,
  COMPLEXITY_BANDS,
  complexity,
  generateText as generate,
  typeable,
  WORD_LETTERS,
  type Passage,
} from "../src/lib/texts";

const PASSAGES: Passage[] = LANGUAGES.flatMap((language) =>
  QUOTES[language].map((q) => ({ language, theme: q.theme ?? null, text: q.text, by: q.by ?? null })),
);
const generateText = (s: RaceSettings) => generate(s, PASSAGES);

const settings = (patch: Partial<RaceSettings>): RaceSettings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
});

const words = (s: Partial<RaceSettings>) => generateText(settings(s))!.text.split(" ");

describe("typeable", () => {
  test("replaces characters that are hard to type", () => {
    expect(typeable("cœur « ok » l’été — fin…")).toBe('coeur " ok " l\'été - fin...');
  });

  test("collapses whitespace and control characters", () => {
    expect(typeable("  a\n\tb   c\u0007 ")).toBe("a b c");
  });
});

describe("generateText", () => {
  test("random words match the requested length", () => {
    expect(words({ length: 40 })).toHaveLength(40);
  });

  test("two races get different texts", () => {
    const a = generateText(settings({ length: 30 }))!.text;
    const b = generateText(settings({ length: 30 }))!.text;
    expect(a).not.toBe(b);
  });

  test("banned characters never appear", () => {
    for (const source of ["words", "quote"] as const) {
      const text = generateText(settings({ source, blacklist: "e", length: 50 }))!.text;
      expect(text.toLowerCase()).not.toContain("e");
    }
  });

  test("hard mode keeps banned characters out of symbols and digits", () => {
    const text = generateText(settings({ difficulty: "hard", blacklist: "0123456789", length: 80 }))!.text;
    expect(text).not.toMatch(/\d/);
  });

  test("easy words are short", () => {
    expect(words({ difficulty: "easy", length: 60 }).every((w) => w.length <= 5)).toBe(true);
  });

  test("accents can be turned off for French", () => {
    const text = generateText(settings({ language: "fr", accents: false, length: 100 }))!.text;
    expect(text).not.toMatch(/[éèêàçùôîâë]/);
  });

  test("punctuation with capitals starts sentences with a capital", () => {
    const text = generateText(settings({ punctuation: true, capitals: true, length: 60 }))!.text;
    expect(text).toMatch(/^[A-Z]/);
    expect(text).toMatch(/[.!?]$/);
  });

  test("practice characters show up more often", () => {
    const count = (t: string) => [...t].filter((c) => c === "z").length;
    let plain = 0;
    let favored = 0;
    for (let i = 0; i < 20; i++) {
      plain += count(generateText(settings({ length: 100 }))!.text);
      favored += count(generateText(settings({ length: 100, priority: "z" }))!.text);
    }
    expect(favored).toBeGreaterThan(plain * 2);
  });

  test("quotes come with their author", () => {
    const out = generateText(settings({ source: "quote", length: 10 }))!;
    expect(out.text.length).toBeGreaterThan(0);
    expect(out.by).not.toBeNull();
  });

  test("code languages give code", () => {
    for (const language of ["javascript", "python", "java", "csharp", "cpp"] as const) {
      const text = generateText(settings({ language, length: 40 }))!.text;
      expect(text).toMatch(/[(){};=.]/);
    }
  });

  test("java quotes are java", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      seen.add(generateText(settings({ source: "quote", language: "java", length: 10 }))!.text);
    }
    expect([...seen].some((t) => /System\.out|public|new /.test(t))).toBe(true);
  });

  test("c# quotes are c#", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      seen.add(generateText(settings({ source: "quote", language: "csharp", length: 10 }))!.text);
    }
    expect([...seen].some((t) => /Console\.WriteLine|var |get; set;/.test(t))).toBe(true);
  });

  test("c++ quotes are c++", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      seen.add(generateText(settings({ source: "quote", language: "cpp", length: 10 }))!.text);
    }
    expect([...seen].some((t) => /std::|#include|nullptr/.test(t))).toBe(true);
  });

  test("custom text is used as is, after cleanup", () => {
    expect(generateText(settings({ source: "custom", customText: "Hi  there" }))!.text).toBe("Hi there");
    expect(generateText(settings({ source: "custom", customText: "" }))).toBeNull();
  });

  test("returns null when nothing matches", () => {
    expect(generateText(settings({ blacklist: "aeiouy" }))).toBeNull();
  });

  test("numbers and capitals only show up when turned on", () => {
    const plain = generateText(settings({ length: 150 }))!.text;
    expect(plain).not.toMatch(/[0-9A-Z]/);
    expect(generateText(settings({ length: 150, numbers: true }))!.text).toMatch(/[0-9]/);
    expect(generateText(settings({ length: 150, capitals: true }))!.text).toMatch(/[A-Z]/);
  });

  test("punctuation without capitals keeps sentences lowercase", () => {
    const text = generateText(settings({ length: 80, punctuation: true }))!.text;
    expect(text).toMatch(/[.!?]/);
    expect(text).not.toMatch(/[A-Z]/);
  });

  test("difficulty limits word length", () => {
    for (const difficulty of ["easy", "medium"] as const) {
      const longest = Math.max(...words({ difficulty, length: 150 }).map((w) => [...w].length));
      expect(longest).toBeLessThanOrEqual(WORD_LETTERS[difficulty]);
    }
    expect(words({ difficulty: "hard", length: 200 }).some((w) => /[^\p{L}]/u.test(w))).toBe(true);
  });

  test("quotes follow the difficulty bands", () => {
    for (const difficulty of ["easy", "hard"] as const) {
      const [low, high] = COMPLEXITY_BANDS[difficulty];
      for (let i = 0; i < 10; i++) {
        const text = generateText(
          settings({ source: "quote", difficulty, length: 1, punctuation: true, capitals: true }),
        )!.text;
        const score = complexity(text);
        expect(score).toBeGreaterThanOrEqual(low);
        expect(score).toBeLessThan(high);
      }
    }
  });

  test("quotes are adapted to the chosen options", () => {
    const s = settings({ language: "fr", accents: false });
    expect(adaptPassage("Je pense, donc je suis.", s)).toBe("je pense donc je suis");
    expect(adaptPassage("L'été arrive!", s)).toBe("l'ete arrive");
    expect(adaptPassage("En 1789, tout change.", s)).toBeNull();
    expect(adaptPassage("En 1789, tout change.", { ...s, numbers: true, punctuation: true, capitals: true })).toBe(
      "En 1789, tout change.",
    );
  });

  test("quotes need the corpus", () => {
    expect(generate(settings({ source: "quote" }), [])).toBeNull();
  });
});
