import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, type RaceSettings } from "../src/lib/race-settings";
import { generateText, typeable } from "../src/lib/texts";

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

  test("punctuation adds capitals and sentence endings", () => {
    const text = generateText(settings({ punctuation: true, length: 60 }))!.text;
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
    for (const language of ["javascript", "python", "java", "csharp"] as const) {
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

  test("custom text is used as is, after cleanup", () => {
    expect(generateText(settings({ source: "custom", customText: "Hi  there" }))!.text).toBe("Hi there");
    expect(generateText(settings({ source: "custom", customText: "" }))).toBeNull();
  });

  test("returns null when nothing matches", () => {
    expect(generateText(settings({ blacklist: "aeiouy" }))).toBeNull();
  });
});
