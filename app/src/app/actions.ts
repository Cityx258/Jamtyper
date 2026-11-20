"use server";

import { cookies } from "next/headers";
import { localeSchema, themeSchema } from "@/lib/schemas";

const ONE_YEAR = 60 * 60 * 24 * 365;
const options = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const };

export async function setLocale(raw: unknown) {
  const locale = localeSchema.safeParse(raw);
  if (!locale.success) return;
  (await cookies()).set("lang", locale.data, options);
}

export async function setTheme(raw: unknown) {
  const theme = themeSchema.safeParse(raw);
  if (!theme.success) return;
  const jar = await cookies();
  if (theme.data === "system") jar.delete("theme");
  else jar.set("theme", theme.data, options);
}
