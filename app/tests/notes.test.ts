import { expect, test } from "bun:test";
import { glyphFor, iconSize, isNote, isSinger, NOTES, newlyUnlocked, noteFor, unlockedNotes, winningPlaces, winsFor } from "../src/lib/notes";

test("a new note every 5 wins, starting with the whole note", () => {
  expect(unlockedNotes(0)).toEqual(["whole"]);
  expect(unlockedNotes(4)).toEqual(["whole"]);
  expect(unlockedNotes(5)).toEqual(["whole", "half"]);
  expect(unlockedNotes(14)).toHaveLength(3);
  expect(unlockedNotes(25)).toHaveLength(6);
  expect(unlockedNotes(30)).toContain("mikuMini");
  expect(unlockedNotes(400)).toHaveLength(NOTES.length);
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

test("bigger human lobbies let more places count as wins", () => {
  expect(winningPlaces(1)).toBe(1);
  expect(winningPlaces(3)).toBe(1);
  expect(winningPlaces(4)).toBe(2);
  expect(winningPlaces(5)).toBe(2);
  expect(winningPlaces(6)).toBe(3);
  expect(winningPlaces(12)).toBe(3);
});

test("singers come after every classic note and draw as eighth notes on the staff", () => {
  expect(winsFor("mikuMini")).toBe(30);
  expect(isSinger("teto")).toBe(true);
  expect(isSinger("whole")).toBe(false);
  expect(glyphFor("gumi")).toBe("eighth");
  expect(glyphFor("half")).toBe("half");
  expect(glyphFor("mikuLeek")).toBe("sixteenth");
});

test("Leek Miku is the pro trophy: 100 wins and a bigger avatar", () => {
  expect(winsFor("teto")).toBe(50);
  expect(winsFor("mikuLeek")).toBe(100);
  expect(unlockedNotes(99)).not.toContain("mikuLeek");
  expect(unlockedNotes(99)).toHaveLength(NOTES.length - 1);
  expect(unlockedNotes(100)).toContain("mikuLeek");
  expect(newlyUnlocked(54, 55)).toBeNull();
  expect(newlyUnlocked(99, 100)).toBe("mikuLeek");
  expect(iconSize("mikuLeek", 40)).toBe(52);
  expect(iconSize("teto", 40)).toBe(40);
  expect(iconSize("half", 40)).toBe(40);
});
