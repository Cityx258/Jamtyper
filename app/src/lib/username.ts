export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

export const isUsername = (v: unknown): v is string =>
  typeof v === "string" && USERNAME_RE.test(v);

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;

export function cleanGuestName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const length = [...name].length;
  return length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX ? name : null;
}
