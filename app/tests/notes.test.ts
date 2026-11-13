import { expect, test } from "bun:test";
import { isNote, newlyUnlocked, noteFor, unlockedNotes, winsFor } from "../src/lib/notes";

test("a new note every 5 wins, starting with the whole note", () => {
  expect(unlockedNotes(0)).toEqual(["whole"]);
  expect(unlockedNotes(4)).toEqual(["whole"]);
  expect(unlockedNotes(5)).toEqual(["whole", "half"]);
  expect(unlockedNotes(14)).toHaveLength(3);
  expect(unlockedNotes(25)).toHaveLength(6);
  expect(unlockedNotes(400)).toHaveLength(6);
});

test("winsFor gives the wins needed for each note", () => {
  expect(winsFor("whole")).toBe(0);
  expect(winsFor("eighth")).toBe(15);
  expect(winsFor("thirtySecond")).toBe(25);
});

test("players show their newest note unless they picked an unlocked one", () => {
  expect(noteFor(12, null)).toBe("quarter");
  expect(noteFor(12, "whole")).toBe("whole");
  expect(noteFor(12, "eighth")).toBe("quarter");
  expect(noteFor(12, "banana")).toBe("quarter");
});

test("newlyUnlocked only fires on the win that crosses a step", () => {
  expect(newlyUnlocked(4, 5)).toBe("half");
  expect(newlyUnlocked(5, 6)).toBeNull();
  expect(newlyUnlocked(24, 25)).toBe("thirtySecond");
  expect(newlyUnlocked(25, 26)).toBeNull();
});

test("isNote", () => {
  expect(isNote("sixteenth")).toBe(true);
  expect(isNote("crotchet")).toBe(false);
});
