import { expect, test } from "bun:test";
import { AVATAR_MAX_BYTES, checkAvatar, sniffImageType } from "../src/lib/avatar";

const bytes = (...values: number[]) => new Uint8Array([...values, ...Array(32).fill(0)]);

test("the real file type is read from its first bytes", () => {
  expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
  const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
  expect(sniffImageType(webp)).toBe("image/webp");
  expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull();
  expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
});

test("files over 2 MB or of another type are refused", () => {
  const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
  big.set([0xff, 0xd8, 0xff]);
  expect(checkAvatar(big)).toBe("too_big");
  expect(checkAvatar(bytes(0x25, 0x50, 0x44, 0x46))).toBe("bad_type");
  expect(checkAvatar(bytes(0xff, 0xd8, 0xff))).toBeNull();
});
