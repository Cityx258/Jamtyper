import { describe, expect, test } from "bun:test";
import { methodViews } from "../src/lib/sign-in-methods";
import type { Provider } from "../src/lib/auth";
import { isUsername } from "../src/lib/username";

const view = (accounts: { id: string; providerId: string }[], enabled: Provider[] = ["discord", "github"]) =>
  Object.fromEntries(methodViews(accounts, enabled).map((v) => [v.method, v]));

describe("sign-in methods", () => {
  test("lists every method in a fixed order", () => {
    expect(methodViews([], []).map((v) => v.method)).toEqual(["credential", "discord", "github"]);
  });

  test("a single method cannot be unlinked", () => {
    const v = view([{ id: "a1", providerId: "discord" }]);
    expect(v.discord.accountId).toBe("a1");
    expect(v.discord.canUnlink).toBe(false);
    expect(v.github.accountId).toBeNull();
  });

  test("a provider can be unlinked once another method exists", () => {
    const v = view([
      { id: "a1", providerId: "credential" },
      { id: "a2", providerId: "github" },
    ]);
    expect(v.github.canUnlink).toBe(true);
    expect(v.credential.canUnlink).toBe(false);
  });

  test("providers without keys are not available, the password always is", () => {
    const v = view([], ["github"]);
    expect(v.discord.available).toBe(false);
    expect(v.github.available).toBe(true);
    expect(v.credential.available).toBe(true);
  });
});

describe("usernames", () => {
  test("accepts 3 to 20 letters, numbers, _ and .", () => {
    expect(isUsername("kai_2.0")).toBe(true);
    expect(isUsername("ab")).toBe(false);
    expect(isUsername("a".repeat(21))).toBe(false);
    expect(isUsername("bad name")).toBe(false);
    expect(isUsername(42)).toBe(false);
  });
});
