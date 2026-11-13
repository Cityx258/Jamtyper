import { expect, test } from "bun:test";
import { generateRoomCode } from "../server/codes";
import { CODE_LENGTH, cleanRoomCodeInput, normalizeRoomCode } from "../src/lib/room-code";

test("generated codes are valid and skip look-alike characters", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateRoomCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(normalizeRoomCode(code)).toBe(code);
    expect(code).not.toMatch(/[01IO]/);
  }
});

test("normalizeRoomCode accepts lower case and rejects anything else", () => {
  expect(normalizeRoomCode(" abc234 ")).toBe("ABC234");
  expect(normalizeRoomCode("ABC12")).toBeNull();
  expect(normalizeRoomCode("ABCD1O")).toBeNull();
  expect(normalizeRoomCode(123456)).toBeNull();
});

test("cleanRoomCodeInput strips separators while typing", () => {
  expect(cleanRoomCodeInput("ab-c 23 4xyz")).toBe("ABC234");
});
