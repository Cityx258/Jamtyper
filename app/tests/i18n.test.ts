import { expect, test } from "bun:test";
import en from "../src/i18n/en";
import fr from "../src/i18n/fr";
import { preferredLocale } from "../src/i18n";

test("the browser language is used when no language was chosen", () => {
  expect(preferredLocale("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr");
  expect(preferredLocale("en-US,en;q=0.9,fr;q=0.8")).toBe("en");
  expect(preferredLocale("de-DE,fr;q=0.5,en;q=0.4")).toBe("fr");
  expect(preferredLocale("en;q=0.2,fr;q=0.7")).toBe("fr");
  expect(preferredLocale("de")).toBe("en");
  expect(preferredLocale(null)).toBe("en");
});

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

test("French and English have exactly the same keys", () => {
  expect(shape(fr)).toEqual(shape(en));
});
