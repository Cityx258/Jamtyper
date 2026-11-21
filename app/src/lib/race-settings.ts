import { z } from "zod";
import { typeable } from "./texts";

export const SOURCES = ["words", "quote", "custom"] as const;
export type TextSource = (typeof SOURCES)[number];
export const CODE_LANGUAGES = ["javascript", "python", "java", "csharp", "cpp"] as const;
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
export const BOT_LEVELS = ["noob", "beginner", "intermediate", "expert", "impossible"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];
export const TEXT_THEMES = ["general", "music", "vocaloid", "nature", "science"] as const;
export type TextTheme = (typeof TEXT_THEMES)[number];
export const CUSTOM_MAX = 1000;
export const CHARS_MAX = 30;
export const LENGTH_MIN = 10;
export const LENGTH_MAX = 200;
export const TIME_GOALS = [0, 30, 45, 60, 90, 120] as const;
export const BOTS_MAX = 9;
export const CAPACITY_MIN = 2;
export const CAPACITY_MAX = 30;

export interface RaceSettings {
  source: TextSource;
  language: Language;
  theme: TextTheme;
  accents: boolean;
  punctuation: boolean;
  numbers: boolean;
  capitals: boolean;
  difficulty: Difficulty;
  blacklist: string;
  priority: string;
  errorMode: ErrorMode;
  bots: boolean;
  botLevels: BotLevel[];
  botLevel: BotLevel;
  boosts: boolean;
  instantDeath: boolean;
  teams: boolean;
  customText: string;
  length: number;
  timeGoalSec: number;
  capacity: number;
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
  numbers: false,
  capitals: false,
  difficulty: "medium",
  blacklist: "",
  priority: "",
  errorMode: "fix",
  bots: true,
  botLevels: [],
  botLevel: "intermediate",
  boosts: true,
  instantDeath: false,
  teams: false,
  customText: "",
  length: 30,
  timeGoalSec: 0,
  capacity: 10,
};

const cleanChars = (value: string) => {
  const chars = [...typeable(value).toLowerCase()].filter((c) => c.trim());
  return [...new Set(chars)].slice(0, CHARS_MAX).join("");
};

const oneOf = <T extends string | number>(list: readonly T[]) =>
  z.custom<T>((v) => list.includes(v as T));

const clamped = (min: number, max: number) =>
  z
    .number()
    .refine(Number.isFinite)
    .transform((v) => Math.min(max, Math.max(min, Math.round(v))));

export const settingsFields = {
  source: z.enum(SOURCES),
  language: z.enum(LANGUAGES),
  theme: z.enum(TEXT_THEMES),
  accents: z.boolean(),
  punctuation: z.boolean(),
  numbers: z.boolean(),
  capitals: z.boolean(),
  difficulty: z.enum(DIFFICULTIES),
  blacklist: z.string().max(200).transform(cleanChars),
  priority: z.string().max(200).transform(cleanChars),
  errorMode: z.enum(ERROR_MODES),
  bots: z.boolean(),
  botLevels: z.array(z.enum(BOT_LEVELS)).max(BOTS_MAX),
  botLevel: z.enum(BOT_LEVELS),
  boosts: z.boolean(),
  instantDeath: z.boolean(),
  teams: z.boolean(),
  customText: z
    .string()
    .max(CUSTOM_MAX * 4)
    .transform((v) => typeable(v).slice(0, CUSTOM_MAX).trim()),
  length: clamped(LENGTH_MIN, LENGTH_MAX),
  timeGoalSec: oneOf(TIME_GOALS),
  capacity: clamped(CAPACITY_MIN, CAPACITY_MAX),
} satisfies { [K in keyof RaceSettings]: z.ZodType<unknown, unknown> };

export const settingsPatchSchema = z.record(z.string(), z.unknown());

export function mergeSettings(current: RaceSettings, patch: unknown): RaceSettings {
  const parsed = settingsPatchSchema.safeParse(patch);
  if (!parsed.success) return current;
  const next: Record<string, unknown> = { ...current };
  for (const [key, schema] of Object.entries(settingsFields)) {
    if (!(key in parsed.data)) continue;
    const field = schema.safeParse(parsed.data[key]);
    if (field.success) next[key] = field.data;
  }
  return next as unknown as RaceSettings;
}

export function settingsView(settings: RaceSettings): SettingsView {
  const { customText, ...rest } = settings;
  return { ...rest, customLength: customText.length };
}
