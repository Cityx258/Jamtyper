export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

export const isUsername = (v: unknown): v is string =>
  typeof v === "string" && USERNAME_RE.test(v);
