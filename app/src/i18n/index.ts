import { cookies, headers } from "next/headers";
import en, { type Dict } from "./en";
import fr from "./fr";

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const dictionaries: Record<Locale, Dict> = { en, fr };

export const isLocale = (v: unknown): v is Locale =>
  LOCALES.includes(v as Locale);
export const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

export function preferredLocale(acceptLanguage: string | null): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("lang")?.value;
  if (isLocale(v)) return v;
  return preferredLocale((await headers()).get("accept-language"));
}

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get("theme")?.value;
  return isTheme(v) ? v : "system";
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}

export type { Dict };
