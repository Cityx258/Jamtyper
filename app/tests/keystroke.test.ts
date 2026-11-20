import { describe, expect, test } from "bun:test";
import { KEY_SCALE, keystrokeMidi, midiToFreq, nextStep } from "../src/lib/keystroke";

const fixed = (value: number) => () => value;

describe("nextStep", () => {
  test("starts anywhere on the scale", () => {
    expect(nextStep(null, fixed(0))).toBe(0);
    expect(nextStep(null, fixed(0.999))).toBe(KEY_SCALE.length - 1);
  });

  test("moves one or two steps and never repeats", () => {
    for (let i = 0; i < 200; i++) {
      const prev = i % KEY_SCALE.length;
      const next = nextStep(prev);
      expect(Math.abs(next - prev)).toBeGreaterThanOrEqual(1);
      expect(Math.abs(next - prev)).toBeLessThanOrEqual(2);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(KEY_SCALE.length);
    }
  });
});

describe("keystrokeMidi", () => {
  test("a good key plays a note of the scale", () => {
    for (let s = 0; s < KEY_SCALE.length; s++) {
      expect(KEY_SCALE).toContain(keystrokeMidi(s, true));
    }
  });

  test("a typo plays a quarter tone away from the scale", () => {
    for (let s = 0; s < KEY_SCALE.length; s++) {
      const midi = keystrokeMidi(s, false);
      expect(Number.isInteger(midi)).toBe(false);
      expect(Math.abs(midi - KEY_SCALE[s])).toBe(0.5);
    }
  });
});

test("midiToFreq tunes A4 to 440 Hz", () => {
  expect(midiToFreq(69)).toBe(440);
  expect(midiToFreq(60)).toBeCloseTo(261.63, 2);
});
