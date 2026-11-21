import { expect, test } from "bun:test";
import { beamSinger } from "../src/lib/beam";

test("the winner's Miku fires the beam", () => {
  const racers = [
    { place: 2, note: "mikuMini" as const },
    { place: 1, note: "mikuLeek" as const },
  ];
  expect(beamSinger(racers, 0)).toBe("mikuLeek");
});

test("without a Miku winner every player gets the same Miku for that race", () => {
  const racers = [{ place: 1, note: "teto" as const }];
  expect(beamSinger(racers, 4)).toBe(beamSinger(racers, 4));
  expect(["mikuMini", "mikuGuitar", "mikuLeek"]).toContain(beamSinger(racers, 4));
  expect(beamSinger([], 7)).toBe("mikuGuitar");
});
