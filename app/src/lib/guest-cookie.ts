import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cleanGuestName } from "./username";

export const GUEST_COOKIE = "jt_guest";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface Guest {
  id: string;
  name: string;
}

const secret = () => process.env.BETTER_AUTH_SECRET ?? "";

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeGuest(guest: Guest): string {
  const payload = Buffer.from(JSON.stringify(guest)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeGuest(value: string | undefined): Guest | null {
  if (!value || !secret()) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<Guest>;
    const name = cleanGuestName(data.name);
    if (typeof data.id !== "string" || !/^[0-9a-f-]{36}$/.test(data.id) || !name) return null;
    return { id: data.id, name };
  } catch {
    return null;
  }
}

export const newGuest = (name: string): Guest => ({ id: randomUUID(), name });

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
