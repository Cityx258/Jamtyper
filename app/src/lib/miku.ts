export const CLEAR_RANKS = ["perfect", "excellent", "great", "standard", "cheap"] as const;
export type ClearRank = (typeof CLEAR_RANKS)[number];

export function clearRank(accuracy: number, mistakes: number): ClearRank {
  if (mistakes === 0) return "perfect";
  if (accuracy >= 0.98) return "excellent";
  if (accuracy >= 0.95) return "great";
  if (accuracy >= 0.88) return "standard";
  return "cheap";
}

export const THANK_YOU_WPM = 39;

export type MikuDay = "birthday" | "mikuDay";

export function mikuDay(now: Date, timeZone = "America/Toronto"): MikuDay | null {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, month: "numeric", day: "numeric" }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  if (month === 8 && day === 31) return "birthday";
  if (month === 3 && day === 9) return "mikuDay";
  return null;
}
