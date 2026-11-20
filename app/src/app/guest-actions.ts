"use server";

import { cookies } from "next/headers";
import {
  decodeGuest,
  encodeGuest,
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE,
  newGuest,
} from "@/lib/guest-cookie";
import { displayNameSchema } from "@/lib/schemas";

export async function setGuestName(raw: unknown): Promise<{ ok: boolean }> {
  const parsed = displayNameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const name = parsed.data;
  const jar = await cookies();
  const current = decodeGuest(jar.get(GUEST_COOKIE)?.value);
  jar.set(GUEST_COOKIE, encodeGuest(current ? { ...current, name } : newGuest(name)), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return { ok: true };
}
