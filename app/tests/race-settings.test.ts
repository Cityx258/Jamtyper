import { describe, expect, test } from "bun:test";
import {
  CUSTOM_MAX,
  DEFAULT_SETTINGS,
  LENGTH_MAX,
  LENGTH_MIN,
  mergeSettings,
  settingsView,
} from "../src/lib/race-settings";

describe("mergeSettings", () => {
  test("keeps the current value when the patch is not an object", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(DEFAULT_SETTINGS, "boosts")).toEqual(DEFAULT_SETTINGS);
  });

  test("ignores values outside the allowed lists", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, {
      language: "klingon",
      timeLimitSec: 42,
      timeGoalSec: 50,
      botLevel: "godlike",
      bots: "yes",
    });
    expect(next).toEqual(DEFAULT_SETTINGS);
  });

  test("applies valid values", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, {
      language: "fr",
      timeLimitSec: 60,
      timeGoalSec: 45,
      instantDeath: true,
      teams: true,
    });
    expect(next.language).toBe("fr");
    expect(next.timeLimitSec).toBe(60);
    expect(next.timeGoalSec).toBe(45);
    expect(next.instantDeath).toBe(true);
    expect(next.teams).toBe(true);
  });

  test("clamps and rounds the length", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { length: 5 }).length).toBe(LENGTH_MIN);
    expect(mergeSettings(DEFAULT_SETTINGS, { length: 9999 }).length).toBe(LENGTH_MAX);
    expect(mergeSettings(DEFAULT_SETTINGS, { length: 42.6 }).length).toBe(43);
    expect(mergeSettings(DEFAULT_SETTINGS, { length: Number.NaN }).length).toBe(
      DEFAULT_SETTINGS.length,
    );
  });

  test("dedupes and lowercases banned characters, dropping spaces", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { blacklist: "AaB b  c" }).blacklist).toBe("abc");
  });

  test("cleans and caps custom text", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, {
      customText: `  “Hello”  —  world\n${"x".repeat(CUSTOM_MAX * 2)}`,
    });
    expect(next.customText.startsWith('"Hello" - world x')).toBe(true);
    expect(next.customText.length).toBeLessThanOrEqual(CUSTOM_MAX);
  });
});

test("settingsView hides the custom text but gives its length", () => {
  const view = settingsView({ ...DEFAULT_SETTINGS, customText: "secret" });
  expect("customText" in view).toBe(false);
  expect(view.customLength).toBe(6);
});
