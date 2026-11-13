import { expect, test } from "bun:test";
import { isTeam, teamGaps, teamScores, winningTeam } from "../src/lib/teams";

test("isTeam only accepts 0 and 1", () => {
  expect([0, 1, 2, "0", null].map(isTeam)).toEqual([true, true, false, false, false]);
});

test("team score is the average speed, so team size does not matter", () => {
  const scores = teamScores([
    { team: 0, wpm: 60 },
    { team: 0, wpm: 40 },
    { team: 1, wpm: 55 },
    { team: null, wpm: 200 },
  ]);
  expect(scores).toEqual([
    { team: 0, wpm: 50, size: 2 },
    { team: 1, wpm: 55, size: 1 },
  ]);
  expect(winningTeam(scores)).toBe(1);
});

test("equal averages are a tie", () => {
  expect(winningTeam(teamScores([{ team: 0, wpm: 40 }, { team: 1, wpm: 40 }]))).toBeNull();
});

test("teamGaps says how many bots each team needs to even out", () => {
  expect(teamGaps([3, 1])).toEqual([0, 2]);
  expect(teamGaps([0, 0])).toEqual([1, 1]);
  expect(teamGaps([2, 2])).toEqual([0, 0]);
});
