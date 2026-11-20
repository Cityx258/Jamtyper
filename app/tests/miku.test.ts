import { describe, expect, test } from "bun:test";
import { clearRank, mikuDay } from "../src/lib/miku";

describe("clearRank", () => {
  test("no mistakes is perfect", () => {
    expect(clearRank(1, 0)).toBe("perfect");
  });

  test("ranks drop with accuracy", () => {
    expect(clearRank(0.99, 1)).toBe("excellent");
    expect(clearRank(0.96, 3)).toBe("great");
    expect(clearRank(0.9, 8)).toBe("standard");
    expect(clearRank(0.7, 20)).toBe("cheap");
  });
});

describe("mikuDay", () => {
  test("August 31 is her birthday in Quebec time", () => {
    expect(mikuDay(new Date("2026-08-31T12:00:00-04:00"))).toBe("birthday");
    expect(mikuDay(new Date("2026-09-01T02:00:00Z"))).toBe("birthday");
  });

  test("March 9 is Miku Day", () => {
    expect(mikuDay(new Date("2027-03-09T12:00:00-05:00"))).toBe("mikuDay");
  });

  test("other days are plain days", () => {
    expect(mikuDay(new Date("2026-11-19T12:00:00-05:00"))).toBeNull();
  });
});
