import { describe, expect, test } from "bun:test";
import { botPlan } from "../src/lib/bot-plan";
import { DEFAULT_SETTINGS, mergeSettings } from "../src/lib/race-settings";

const plan = (sizes: [number, number], patch: Record<string, unknown> = {}) =>
  botPlan(sizes, { ...DEFAULT_SETTINGS, ...patch });

describe("bot plan", () => {
  test("auto only fills up to 2 racers", () => {
    expect(plan([1, 0])).toEqual([null]);
    expect(plan([2, 1])).toEqual([]);
  });

  test("a chosen number adds at least that many bots", () => {
    expect(plan([1, 0], { botCount: 4 })).toHaveLength(4);
    expect(plan([3, 2], { botCount: 2 })).toHaveLength(2);
  });

  test("no bots when they are off or nobody races", () => {
    expect(plan([1, 0], { bots: false, botCount: 5 })).toEqual([]);
    expect(plan([0, 0], { botCount: 5 })).toEqual([]);
  });

  test("teams are evened out first, then extra bots alternate", () => {
    expect(plan([2, 0], { teams: true })).toEqual([1, 1]);
    const teams = plan([2, 0], { teams: true, botCount: 5 });
    expect(teams).toHaveLength(5);
    expect(teams.slice(0, 2)).toEqual([1, 1]);
    expect(teams.filter((t) => t === 0)).toHaveLength(2);
    expect(teams.filter((t) => t === 1)).toHaveLength(3);
  });

  test("the bot count is checked like any other setting", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { botCount: 7 }).botCount).toBe(7);
    expect(mergeSettings(DEFAULT_SETTINGS, { botCount: 50 }).botCount).toBe(0);
    expect(mergeSettings(DEFAULT_SETTINGS, { botCount: "3" }).botCount).toBe(0);
  });
});
