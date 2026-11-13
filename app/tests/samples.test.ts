import { expect, test } from "bun:test";
import { niceMax, sampleTime } from "../src/lib/race-graph";
import { sampleRace, sampleRacer } from "../server/samples";
import { race, racer } from "./helpers";

test("no samples during the first second", () => {
  const r = racer({ position: 10 });
  const rc = race([r]);
  sampleRacer(rc, r, rc.startsAt + 900);
  expect(r.samples).toEqual([]);
});

test("ten samples per second, filling any slot a slow tick skipped", () => {
  const r = racer({ position: 50 });
  const rc = race([r]);
  sampleRacer(rc, r, rc.startsAt + 1_000);
  sampleRacer(rc, r, rc.startsAt + 1_050);
  expect(r.samples).toHaveLength(1);
  sampleRacer(rc, r, rc.startsAt + 2_000);
  expect(r.samples).toHaveLength(11);
});

test("samples are the WPM at that moment", () => {
  const r = racer({ position: 100 });
  const rc = race([r]);
  sampleRacer(rc, r, rc.startsAt + 60_000);
  expect(r.samples.at(-1)).toBe(20);
});

test("racers who are done stop being sampled", () => {
  const done = racer({ position: 100, outcome: "finished", doneAt: 30_000 });
  const going = racer({ position: 100 });
  const rc = race([done, going]);
  sampleRace(rc, rc.startsAt + 3_000);
  expect(done.samples).toEqual([]);
  expect(going.samples).toHaveLength(21);
});

test("a later sample in the same slot replaces it, so the line ends on the final speed", () => {
  const r = racer({ position: 50 });
  const rc = race([r]);
  sampleRacer(rc, r, rc.startsAt + 1_510);
  const first = r.samples[5];
  r.position = 60;
  sampleRacer(rc, r, rc.startsAt + 1_590);
  expect(r.samples).toHaveLength(6);
  expect(r.samples[5]).toBeGreaterThan(first);
});

test("axis helpers", () => {
  expect(sampleTime(0)).toBe(1);
  expect(sampleTime(15)).toBe(2.5);
  expect(niceMax(43)).toBe(50);
  expect(niceMax(112)).toBe(125);
  expect(niceMax(0)).toBe(10);
});
