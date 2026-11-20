export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_SIZE = 256;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

export function sniffImageType(bytes: Uint8Array): AvatarType | null {
  const at = (i: number, ...values: number[]) => values.every((v, j) => bytes[i + j] === v);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

export type AvatarError = "too_big" | "bad_type" | "unreadable";

export function checkAvatar(bytes: Uint8Array): AvatarError | null {
  if (bytes.length > AVATAR_MAX_BYTES) return "too_big";
  return sniffImageType(bytes) ? null : "bad_type";
}
