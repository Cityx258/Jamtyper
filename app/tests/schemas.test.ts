import { expect, test } from "bun:test";
import {
  displayNameSchema,
  joinRoomSchema,
  progressSchema,
  teamSchema,
  visibilitySchema,
} from "../src/lib/schemas";

test("socket messages with unexpected fields or types are rejected", () => {
  expect(joinRoomSchema.safeParse({ code: "ABC234" }).success).toBe(true);
  expect(joinRoomSchema.safeParse({ code: "ABC234", admin: true }).success).toBe(false);
  expect(joinRoomSchema.safeParse({ code: 12 }).success).toBe(false);
  expect(visibilitySchema.safeParse({ visibility: "secret" }).success).toBe(false);
  expect(teamSchema.safeParse({ memberId: "a", team: 2 }).success).toBe(false);
});

test("progress must be whole positive counts with single-character keys", () => {
  const ok = { position: 10, mistakes: 1, errors: 0, missed: { a: 1 } };
  expect(progressSchema.safeParse(ok).success).toBe(true);
  expect(progressSchema.safeParse({ ...ok, position: -1 }).success).toBe(false);
  expect(progressSchema.safeParse({ ...ok, position: 1.5 }).success).toBe(false);
  expect(progressSchema.safeParse({ ...ok, missed: { ab: 1 } }).success).toBe(false);
});

test("display names are trimmed and must have 3 to 20 characters", () => {
  expect(displayNameSchema.parse("  Mélodie   Do ")).toBe("Mélodie Do");
  expect(displayNameSchema.safeParse("ab").success).toBe(false);
  expect(displayNameSchema.safeParse("x".repeat(21)).success).toBe(false);
});
