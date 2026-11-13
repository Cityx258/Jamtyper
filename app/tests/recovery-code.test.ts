import { expect, test } from "bun:test";
import {
  hashRecoveryCode,
  newRecoveryCode,
  normalizeRecoveryCode,
  sameHash,
} from "../src/lib/recovery-code";

test("codes come in four groups of four, with no look-alike characters", () => {
  const codes = new Set<string>();
  for (let i = 0; i < 100; i++) {
    const code = newRecoveryCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
    codes.add(code);
  }
  expect(codes.size).toBe(100);
});

test("typing the code loosely still matches", () => {
  const code = newRecoveryCode();
  const exact = normalizeRecoveryCode(code);
  expect(normalizeRecoveryCode(code.toLowerCase().replace(/-/g, " "))).toBe(exact);
  expect(normalizeRecoveryCode(` ${code} `)).toBe(exact);
});

test("malformed codes are rejected", () => {
  expect(normalizeRecoveryCode("ABCD-EFGH")).toBeNull();
  expect(normalizeRecoveryCode("ABCD-EFGH-JKLM-NPQ0")).toBeNull();
  expect(normalizeRecoveryCode(42)).toBeNull();
});

test("hashes compare by value only", () => {
  const a = hashRecoveryCode("ABCDEFGHJKLMNPQR");
  expect(sameHash(a, hashRecoveryCode("ABCDEFGHJKLMNPQR"))).toBe(true);
  expect(sameHash(a, hashRecoveryCode("ABCDEFGHJKLMNPQS"))).toBe(false);
  expect(sameHash(a, "")).toBe(false);
});
