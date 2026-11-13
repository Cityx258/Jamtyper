import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { CODE_ALPHABET } from "./room-code";

const GROUPS = 4;
const GROUP_LENGTH = 4;

export function newRecoveryCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i++) {
      group += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

export function normalizeRecoveryCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const chars = input.toUpperCase().replace(/[\s-]/g, "");
  const valid = new RegExp(`^[${CODE_ALPHABET}]{${GROUPS * GROUP_LENGTH}}$`);
  return valid.test(chars) ? chars : null;
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
