import { describe, expect, test } from "bun:test";
import { botPlan } from "../src/lib/bot-plan";
import { DEFAULT_SETTINGS, mergeSettings } from "../src/lib/race-settings";

const plan = (sizes: [number, number], patch: Record<string, unknown> = {}) =>
  botPlan(sizes, { ...DEFAULT_SETTINGS, ...patch });

describe("bot plan", () => {
  test("filler bots only bring the race up to 2 racers", () => {
    expect(plan([1, 0])).toEqual([{ team: null, level: "intermediate" }]);
    expect(plan([2, 1])).toEqual([]);
  });

  test("added bots always race with their own level", () => {
    expect(plan([3, 2], { botLevels: ["noob", "expert"] })).toEqual([
      { team: null, level: "noob" },
      { team: null, level: "expert" },
    ]);
    expect(plan([1, 0], { bots: false, botLevels: ["impossible"] })).toHaveLength(1);
  });

  test("no bots when filling is off and none were added, or nobody races", () => {
    expect(plan([1, 0], { bots: false })).toEqual([]);
    expect(plan([0, 0], { botLevels: ["noob"] })).toEqual([]);
  });

  test("teams are evened out first, then added bots alternate", () => {
    expect(plan([2, 0], { teams: true }).map((b) => b.team)).toEqual([1, 1]);
    const teams = plan([2, 0], {
      teams: true,
      botLevels: ["noob", "noob", "noob", "noob", "noob"],
    }).map((b) => b.team);
    expect(teams).toHaveLength(5);
    expect(teams.slice(0, 2)).toEqual([1, 1]);
    expect(teams.filter((t) => t === 0)).toHaveLength(2);
    expect(teams.filter((t) => t === 1)).toHaveLength(3);
  });

  test("the bot list is checked like any other setting", () => {
    expect(mergeSettings(DEFAULT_SETTINGS, { botLevels: ["noob", "expert"] }).botLevels).toEqual([
      "noob",
      "expert",
    ]);
    expect(mergeSettings(DEFAULT_SETTINGS, { botLevels: ["godlike"] }).botLevels).toEqual([]);
    expect(mergeSettings(DEFAULT_SETTINGS, { botLevels: Array(10).fill("noob") }).botLevels).toEqual(
      [],
    );
    expect(mergeSettings(DEFAULT_SETTINGS, { botLevels: "noob" }).botLevels).toEqual([]);
  });
});
