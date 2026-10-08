import { cookies } from "next/headers";
import en, { type Dict } from "./en";
import fr from "./fr";

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

const dictionaries: Record<Locale, Dict> = { en, fr };

export const isLocale = (v: unknown): v is Locale =>
  LOCALES.includes(v as Locale);
export const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("lang")?.value;
  return isLocale(v) ? v : "en";
}

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get("theme")?.value;
  return isTheme(v) ? v : "dark";
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}

export type { Dict };
