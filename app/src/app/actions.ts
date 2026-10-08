"use server";

import { cookies } from "next/headers";
import { isLocale, isTheme } from "@/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;
const options = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const };

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set("lang", locale, options);
}

export async function setTheme(theme: string) {
  if (!isTheme(theme)) return;
  (await cookies()).set("theme", theme, options);
}
