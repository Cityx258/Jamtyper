import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { DEFAULT_SETTINGS, type RaceSettings } from "../src/lib/race-settings";
import type { AppServer, AppSocket, Member, Room } from "../server/room-state";

const query: object = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === "then") {
        return (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          Promise.resolve([{ id: "race-id" }]).then(ok, fail);
      }
      if (prop === "catch") return () => Promise.resolve();
      if (prop === "transaction") return (run: (tx: object) => unknown) => run(query);
      return () => query;
    },
  },
);
mock.module("../src/db", () => ({ db: query }));

let race: typeof import("../server/race");
let state: typeof import("../server/room-state");
beforeAll(async () => {
  race = await import("../server/race");
  state = await import("../server/room-state");
});

const io = { to: () => ({ emit() {} }) } as unknown as AppServer;
let room: Room;

function member(key: string, patch: Partial<Member> = {}): Member {
  return {
    id: `id-${key}`,
    key,
    userId: null,
    name: key,
    watching: false,
    watchRequested: false,
    team: 0,
    note: "whole",
    wins: 0,
    joinedAt: Date.now(),
    sockets: new Set(["s"]),
    ...patch,
  };
}

function setupRoom(members: Member[], settings: Partial<RaceSettings> = {}) {
  room = {
    id: "room-id",
    code: "ABC234",
    hostKey: members[0].key,
    status: "lobby",
    visibility: "semi_public",
    settings: { ...DEFAULT_SETTINGS, ...settings },
    members: new Map(members.map((m) => [m.key, m])),
    banned: new Set(),
    invitesIssued: 0,
    race: null,
  };
  state.rooms.set(room.code, room);
}

const socket = (key: string) =>
  ({ data: { identity: { key }, roomCode: "ABC234" } }) as unknown as AppSocket;

function startRacing(sinceMs = 10_000) {
  expect(race.startRace(io, socket("host"))).toEqual({ ok: true });
  room.status = "racing";
  room.race!.startsAt = Date.now() - sinceMs;
  return room.race!;
}

const progress = (key: string, position: number, mistakes = 0, errors = 0) =>
  race.recordProgress(io, socket(key), { position, mistakes, errors, missed: {} });

afterEach(() => {
  if (room?.race) race.stopRace(room.race);
  state.rooms.clear();
});

describe("starting a race", () => {
  test("only the host can start", () => {
    setupRoom([member("host"), member("guest")]);
    expect(race.startRace(io, socket("guest"))).toEqual({ ok: false, error: "not_host" });
  });

  test("a lone player without bots can't start", () => {
    setupRoom([member("host")], { bots: false });
    expect(race.startRace(io, socket("host"))).toEqual({
      ok: false,
      error: "not_enough_racers",
    });
  });

  test("a bot joins a lone player", () => {
    setupRoom([member("host")]);
    race.startRace(io, socket("host"));
    const racers = [...room.race!.racers.values()];
    expect(racers).toHaveLength(2);
    expect(racers.filter((r) => r.bot)).toHaveLength(1);
  });

  test("spectators and disconnected players don't race", () => {
    setupRoom([
      member("host"),
      member("watcher", { watching: true }),
      member("gone", { sockets: new Set() }),
      member("guest"),
    ]);
    race.startRace(io, socket("host"));
    expect([...room.race!.racers.keys()].sort()).toEqual(["id-guest", "id-host"]);
  });

  test("bots even out the teams", () => {
    setupRoom(
      [member("host"), member("a"), member("b"), member("c", { team: 1 })],
      { teams: true },
    );
    race.startRace(io, socket("host"));
    const racers = [...room.race!.racers.values()];
    expect(racers.filter((r) => r.team === 0)).toHaveLength(3);
    expect(racers.filter((r) => r.team === 1)).toHaveLength(3);
    expect(racers.filter((r) => r.bot).every((r) => r.team === 1)).toBe(true);
  });

  test("an empty team is refused when bots are off", () => {
    setupRoom([member("host"), member("guest")], { teams: true, bots: false });
    expect(race.startRace(io, socket("host"))).toEqual({ ok: false, error: "empty_team" });
  });
});

describe("progress", () => {
  test("is accepted at human speed", () => {
    setupRoom([member("host"), member("guest")], { bots: false });
    const r = startRacing();
    progress("guest", 30);
    expect(r.racers.get("id-guest")!.position).toBe(30);
  });

  test("faster than a human can type is ignored", () => {
    setupRoom([member("host"), member("guest")], { bots: false });
    const r = startRacing(1_000);
    progress("guest", 100);
    expect(r.racers.get("id-guest")!.position).toBe(0);
  });

  test("can't go backwards or past the end", () => {
    setupRoom([member("host"), member("guest")], { bots: false });
    const r = startRacing(60_000);
    progress("guest", 30);
    progress("guest", 10);
    progress("guest", r.text.length + 1);
    expect(r.racers.get("id-guest")!.position).toBe(30);
  });

  test("malformed payloads are ignored", () => {
    setupRoom([member("host"), member("guest")], { bots: false });
    const r = startRacing();
    for (const bad of [null, { position: -1 }, { position: 5, mistakes: "x" }, { position: 5, mistakes: 0, missed: { ab: 1 } }]) {
      race.recordProgress(io, socket("guest"), bad);
    }
    race.recordProgress(io, socket("guest"), { position: 5, mistakes: 0, errors: 9, missed: {} });
    expect(r.racers.get("id-guest")!.position).toBe(0);
  });

  test("errors only count in keep-going mode", () => {
    setupRoom([member("host"), member("guest")], { bots: false, errorMode: "fix" });
    const r = startRacing();
    progress("guest", 20, 2, 2);
    expect(r.racers.get("id-guest")!.errors).toBe(0);
  });
});

describe("ending a race", () => {
  test("finishing places the racer and starts the closing timer", () => {
    setupRoom([member("host"), member("guest")], { bots: false });
    const r = startRacing(60_000);
    progress("guest", r.text.length);
    expect(r.racers.get("id-guest")!.place).toBe(1);
    expect(room.status).toBe("finishing");
    expect(r.closesAt).not.toBeNull();
  });

  test("the race ends once no human is still racing", () => {
    setupRoom([member("host")]);
    startRacing();
    expect(race.forfeit(io, socket("host"))).toEqual({ ok: true });
    expect(room.status).toBe("results");
  });

  test("instant death knocks out on the first typo", () => {
    setupRoom([member("host"), member("guest")], { bots: false, instantDeath: true });
    const r = startRacing();
    progress("guest", 5, 1);
    expect(r.racers.get("id-guest")!.outcome).toBe("eliminated");
    expect(room.status).toBe("racing");
  });

  test("finishers rank ahead of everyone else", () => {
    setupRoom([member("host"), member("guest"), member("third")], { bots: false });
    const r = startRacing(60_000);
    progress("third", 40);
    progress("guest", r.text.length);
    race.forfeit(io, socket("host"));
    race.forfeit(io, socket("third"));
    expect(room.status).toBe("results");
    const place = (key: string) => r.racers.get(`id-${key}`)!.place;
    expect(place("guest")).toBe(1);
    expect(place("third")).toBe(2);
    expect(place("host")).toBe(3);
  });
});
