import { DEFAULT_SETTINGS, type RaceSettings } from "../src/lib/race-settings";
import type { Race, Racer } from "../server/room-state";

export function racer(patch: Partial<Racer> = {}): Racer {
  return {
    id: patch.id ?? crypto.randomUUID(),
    userId: null,
    name: "Racer",
    position: 0,
    mistakes: 0,
    errors: 0,
    missed: {},
    outcome: "racing",
    doneAt: null,
    place: null,
    bot: null,
    team: null,
    note: "whole",
    pitch: 0,
    unlocked: null,
    samples: [],
    jump: 0,
    bonus: 0,
    boost: null,
    lastBoostAt: 0,
    ...patch,
  };
}

export function race(racers: Racer[], settings: Partial<RaceSettings> = {}, text?: string): Race {
  return {
    dbId: null,
    text: text ?? Array(40).fill("word").join(" "),
    by: null,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    startsAt: Date.now(),
    endsAt: Date.now() + 60_000,
    closesAt: null,
    endedAt: null,
    racers: new Map(racers.map((r) => [r.id, r])),
    dirty: false,
    timers: [],
  };
}
