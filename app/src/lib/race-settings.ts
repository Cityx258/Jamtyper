export const LENGTH_MIN = 10;
export const LENGTH_MAX = 200;
export const TIME_LIMITS = [30, 60, 120, 180, 300, 600] as const;

export interface RaceSettings {
  length: number;
  timeLimitSec: number;
}

export type SettingsView = RaceSettings;

export const DEFAULT_SETTINGS: RaceSettings = {
  length: 30,
  timeLimitSec: 180,
};

const pick = <T>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function mergeSettings(current: RaceSettings, patch: unknown): RaceSettings {
  const p = (patch && typeof patch === "object" ? patch : {}) as Record<string, unknown>;
  return {
    length: clampInt(p.length, LENGTH_MIN, LENGTH_MAX, current.length),
    timeLimitSec: pick(TIME_LIMITS, p.timeLimitSec, current.timeLimitSec),
  };
}

export function settingsView(settings: RaceSettings): SettingsView {
  return { ...settings };
}
