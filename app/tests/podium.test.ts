import { expect, test } from "bun:test";
import { podiumRacers } from "../src/components/Podium";
import type { RacerOutcome, RacerView } from "../src/lib/room-protocol";

const view = (name: string, place: number | null, outcome: RacerOutcome): RacerView => ({
  id: name,
  name,
  progress: 0,
  errors: 0,
  isBot: false,
  team: null,
  note: "whole",
  unlocked: null,
  samples: null,
  wpm: 0,
  accuracy: 1,
  outcome,
  place,
  missed: {},
  jump: 0,
  boost: null,
  timeMs: null,
});

test("the top three finishers stand on the podium, in order", () => {
  const top = podiumRacers([
    view("d", 4, "finished"),
    view("b", 2, "finished"),
    view("a", 1, "finished"),
    view("c", 3, "timed_out"),
  ]);
  expect(top.map((r) => r.name)).toEqual(["a", "b", "c"]);
});

test("racers who quit or were knocked out never stand on it", () => {
  const top = podiumRacers([
    view("a", 1, "finished"),
    view("b", 2, "forfeited"),
    view("c", 3, "eliminated"),
  ]);
  expect(top.map((r) => r.name)).toEqual(["a"]);
});
