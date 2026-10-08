// No 0/O or 1/I: codes get read aloud and typed from a screen.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

const VALID = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/** Upper-cases and strips anything that can't be in a code (spaces, dashes, ...). */
export function cleanRoomCodeInput(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((c) => CODE_ALPHABET.includes(c))
    .join("")
    .slice(0, CODE_LENGTH);
}

/** Returns the canonical code, or null if the input isn't a valid one. */
export function normalizeRoomCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return VALID.test(code) ? code : null;
}
