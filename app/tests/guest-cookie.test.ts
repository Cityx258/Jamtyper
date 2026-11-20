import { beforeAll, expect, test } from "bun:test";
import { decodeGuest, encodeGuest, newGuest, readCookie } from "../src/lib/guest-cookie";

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET ??= "test-secret-that-is-long-enough-123456";
});

test("a signed guest cookie reads back", () => {
  const guest = newGuest("Melody");
  expect(decodeGuest(encodeGuest(guest))).toEqual(guest);
});

test("a tampered cookie is rejected", () => {
  const value = encodeGuest(newGuest("Melody"));
  const [payload, signature] = value.split(".");
  const forged = Buffer.from(JSON.stringify({ id: crypto.randomUUID(), name: "Hacker" })).toString(
    "base64url",
  );
  expect(decodeGuest(`${forged}.${signature}`)).toBeNull();
  expect(decodeGuest(`${payload}.x${signature.slice(1)}`)).toBeNull();
  expect(decodeGuest("garbage")).toBeNull();
  expect(decodeGuest(undefined)).toBeNull();
});

test("names outside 3 to 20 characters are rejected even when signed", () => {
  expect(decodeGuest(encodeGuest({ id: crypto.randomUUID(), name: "ab" }))).toBeNull();
});

test("cookies are read from the header", () => {
  expect(readCookie("a=1; jt_guest=abc.def; b=2", "jt_guest")).toBe("abc.def");
  expect(readCookie("a=1", "jt_guest")).toBeUndefined();
});
