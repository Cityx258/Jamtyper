import { typeable } from "./texts";

export const SOURCES = ["words", "quote", "custom"] as const;
export type TextSource = (typeof SOURCES)[number];
export const CODE_LANGUAGES = ["javascript", "python", "java"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
export const LANGUAGES = ["en", "fr", ...CODE_LANGUAGES] as const;
export type Language = (typeof LANGUAGES)[number];
export type NaturalLanguage = Exclude<Language, CodeLanguage>;
export const isCodeLanguage = (l: Language): l is CodeLanguage =>
  (CODE_LANGUAGES as readonly string[]).includes(l);
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const ERROR_MODES = ["fix", "continue"] as const;
export type ErrorMode = (typeof ERROR_MODES)[number];
export const BOT_LEVELS = ["easy", "medium", "expert", "impossible"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];
export const TEXT_THEMES = ["general", "music", "nature", "science"] as const;
export type TextTheme = (typeof TEXT_THEMES)[number];
export const CUSTOM_MAX = 1000;
export const CHARS_MAX = 30;
export const LENGTH_MIN = 10;
export const LENGTH_MAX = 200;
export const TIME_LIMITS = [30, 60, 120, 180, 300, 600] as const;
export const TIME_GOALS = [0, 30, 45, 60, 90, 120] as const;

export interface RaceSettings {
  source: TextSource;
  language: Language;
  theme: TextTheme;
  accents: boolean;
  punctuation: boolean;
  difficulty: Difficulty;
  blacklist: string;
  priority: string;
  errorMode: ErrorMode;
  bots: boolean;
  botLevel: BotLevel;
  boosts: boolean;
  instantDeath: boolean;
  teams: boolean;
  customText: string;
  length: number;
  timeLimitSec: number;
  timeGoalSec: number;
}

export type SettingsView = Omit<RaceSettings, "customText"> & {
  customLength: number;
};

export const DEFAULT_SETTINGS: RaceSettings = {
  source: "words",
  language: "en",
  theme: "general",
  accents: true,
  punctuation: false,
  difficulty: "medium",
  blacklist: "",
  priority: "",
  errorMode: "fix",
  bots: true,
  botLevel: "medium",
  boosts: true,
  instantDeath: false,
  teams: false,
  customText: "",
  length: 30,
  timeLimitSec: 180,
  timeGoalSec: 0,
};

const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const pick = <T>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function cleanCustom(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return typeable(value).slice(0, CUSTOM_MAX).trim();
}

function cleanChars(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const chars = [...typeable(value).toLowerCase()].filter((c) => c.trim());
  return [...new Set(chars)].slice(0, CHARS_MAX).join("");
}

export function mergeSettings(current: RaceSettings, patch: unknown): RaceSettings {
  const p = (patch && typeof patch === "object" ? patch : {}) as Record<string, unknown>;
  return {
    source: pick(SOURCES, p.source, current.source),
    language: pick(LANGUAGES, p.language, current.language),
    theme: pick(TEXT_THEMES, p.theme, current.theme),
    accents: bool(p.accents, current.accents),
    punctuation: bool(p.punctuation, current.punctuation),
    difficulty: pick(DIFFICULTIES, p.difficulty, current.difficulty),
    blacklist: cleanChars(p.blacklist, current.blacklist),
    priority: cleanChars(p.priority, current.priority),
    errorMode: pick(ERROR_MODES, p.errorMode, current.errorMode),
    bots: bool(p.bots, current.bots),
    botLevel: pick(BOT_LEVELS, p.botLevel, current.botLevel),
    boosts: bool(p.boosts, current.boosts),
    instantDeath: bool(p.instantDeath, current.instantDeath),
    teams: bool(p.teams, current.teams),
    customText: cleanCustom(p.customText, current.customText),
    length: clampInt(p.length, LENGTH_MIN, LENGTH_MAX, current.length),
    timeLimitSec: pick(TIME_LIMITS, p.timeLimitSec, current.timeLimitSec),
    timeGoalSec: pick(TIME_GOALS, p.timeGoalSec, current.timeGoalSec),
  };
}

export function settingsView(settings: RaceSettings): SettingsView {
  const { customText, ...rest } = settings;
  return { ...rest, customLength: customText.length };
}
