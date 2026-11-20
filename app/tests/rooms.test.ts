import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { DEFAULT_SETTINGS } from "../src/lib/race-settings";
import type { AppServer, AppSocket, Member, Room } from "../server/room-state";

const query: object = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === "then") {
        return (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          Promise.resolve([{ id: "row-id" }]).then(ok, fail);
      }
      if (prop === "catch") return () => Promise.resolve();
      if (prop === "transaction") return (run: (tx: object) => unknown) => run(query);
      return () => query;
    },
  },
);
mock.module("../src/db", () => ({ db: query }));

let rooms: typeof import("../server/rooms");
let state: typeof import("../server/room-state");
let limiter: typeof import("../server/rate-limit");
beforeAll(async () => {
  rooms = await import("../server/rooms");
  state = await import("../server/room-state");
  limiter = await import("../server/rate-limit");
});

const io = {
  to: () => ({ emit() {} }),
  in: () => ({ socketsLeave() {} }),
  sockets: { sockets: new Map() },
} as unknown as AppServer;

let n = 0;
function socket(key: string, ip = "1.1.1.1", name = "Player") {
  return {
    id: `s${n++}`,
    data: { identity: { key, userId: null, name, image: null, ip } },
    join() {},
    leave() {},
    emit() {},
  } as unknown as AppSocket;
}

function member(key: string, patch: Partial<Member> = {}): Member {
  return {
    id: `id-${key}`,
    key,
    userId: null,
    name: key,
    image: null,
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

function makeRoom(code: string, patch: Partial<Room> = {}, members = [member(`host-${code}`)]): Room {
  const room: Room = {
    id: `room-${code}`,
    code,
    hostKey: members[0].key,
    status: "lobby",
    visibility: "public",
    settings: { ...DEFAULT_SETTINGS },
    members: new Map(members.map((m) => [m.key, m])),
    banned: new Set(),
    invites: [],
    createdAt: Date.now(),
    race: null,
    ...patch,
  };
  state.rooms.set(code, room);
  return room;
}

const join = (s: AppSocket, payload: Record<string, unknown>) => rooms.joinRoom(io, s, payload);

afterEach(() => {
  state.rooms.clear();
  (rooms.joinFailures as unknown as { hits: Map<string, number[]> }).hits.clear();
});

describe("joining a room", () => {
  test("guests need a name of 3 to 20 characters from their signed cookie", async () => {
    makeRoom("ABCDEF");
    expect(await join(socket("g1", "1.1.1.1", ""), { code: "ABCDEF" })).toEqual({
      ok: false,
      error: "bad_name",
    });
    expect(await join(socket("g1", "1.1.1.1", "ab"), { code: "ABCDEF" })).toEqual({
      ok: false,
      error: "bad_name",
    });
    expect((await join(socket("g1", "1.1.1.1", "abc"), { code: "ABCDEF" })).ok).toBe(true);
  });

  test("nobody joins while a race is running, but members can reconnect", async () => {
    const room = makeRoom("ABCDEF", { status: "racing" });
    expect(await join(socket("late"), { code: "ABCDEF" })).toEqual({
      ok: false,
      error: "race_in_progress",
    });
    expect((await join(socket(room.hostKey), { code: "ABCDEF" })).ok).toBe(true);
  });

  test("a full room lets newcomers in as spectators", async () => {
    makeRoom("ABCDEF", {
      settings: { ...DEFAULT_SETTINGS, capacity: 2, botLevels: ["noob"] },
    });
    const res = await join(socket("late"), { code: "ABCDEF" });
    expect(res.ok && res.room.members.find((m) => m.name === "Player")?.role).toBe("spectator");
  });

  test("one room at a time: joining another asks first, then moves you", async () => {
    makeRoom("ABCDEF");
    makeRoom("GHJKLM");
    const s = socket("mover");
    expect((await join(s, { code: "ABCDEF" })).ok).toBe(true);
    expect(await join(socket("mover"), { code: "GHJKLM" })).toEqual({
      ok: false,
      error: "in_other_room",
      otherRoom: "ABCDEF",
    });
    expect((await join(socket("mover"), { code: "GHJKLM", leaveOther: true })).ok).toBe(true);
    expect(state.rooms.get("ABCDEF")!.members.has("mover")).toBe(false);
    expect(state.rooms.get("GHJKLM")!.members.has("mover")).toBe(true);
  });

  test("a second tab in the same room doesn't add a duplicate", async () => {
    const room = makeRoom("ABCDEF");
    await join(socket("tabs"), { code: "ABCDEF" });
    await join(socket("tabs"), { code: "ABCDEF" });
    expect([...room.members.keys()].filter((k) => k === "tabs")).toHaveLength(1);
  });

  test("wrong codes are limited per IP", async () => {
    for (let i = 0; i < rooms.JOIN_FAILURES_PER_MINUTE; i++) {
      expect((await join(socket("x", "9.9.9.9"), { code: "ZZZZZZ" })).ok).toBe(false);
    }
    makeRoom("ABCDEF");
    expect(await join(socket("x", "9.9.9.9"), { code: "ABCDEF" })).toEqual({
      ok: false,
      error: "too_many_attempts",
    });
    expect((await join(socket("y", "8.8.8.8"), { code: "ABCDEF" })).ok).toBe(true);
  });
});

describe("invite links", () => {
  function privateRoom() {
    const room = makeRoom("ABCDEF", { visibility: "private" });
    room.invites.push({
      id: "inv",
      token: "a".repeat(24),
      createdAt: Date.now(),
      usedBy: null,
      usedName: null,
      ip: null,
      revoked: false,
    });
    return room;
  }

  test("the code alone doesn't open a private room", async () => {
    privateRoom();
    expect(await join(socket("g"), { code: "ABCDEF" })).toEqual({
      ok: false,
      error: "invite_required",
    });
  });

  test("a used link is tied to the first IP, which can reconnect with it", async () => {
    const room = privateRoom();
    const invite = "a".repeat(24);
    expect((await join(socket("first", "1.2.3.4"), { code: "ABCDEF", invite })).ok).toBe(true);
    expect(room.invites[0].usedName).toBe("Player");
    expect(await join(socket("other", "5.6.7.8"), { code: "ABCDEF", invite })).toEqual({
      ok: false,
      error: "invite_used",
    });
    await rooms.removeMember(io, room, room.members.get("first")!);
    expect((await join(socket("first", "1.2.3.4"), { code: "ABCDEF", invite })).ok).toBe(true);
  });

  test("kicking someone revokes their link", async () => {
    const room = privateRoom();
    await join(socket("first", "1.2.3.4"), { code: "ABCDEF", invite: "a".repeat(24) });
    rooms.revokeInvitesOf(io, room, room.members.get("first")!);
    expect(room.invites[0].revoked).toBe(true);
    expect(state.inviteViews(room)).toEqual([]);
  });
});

describe("quick race", () => {
  test("picks the joinable public room closest to full, oldest first on ties", () => {
    const settings = (capacity: number) => ({ ...DEFAULT_SETTINGS, capacity });
    const two = [member("a"), member("b")];
    makeRoom("OLDEST", { settings: settings(4), createdAt: 1 }, two);
    makeRoom("NEWEST", { settings: settings(4), createdAt: 2 }, [member("c"), member("d")]);
    makeRoom("ROOMY0", { settings: settings(30), createdAt: 0 }, [member("e")]);
    makeRoom("FULL00", { settings: settings(2), createdAt: 0 }, [member("f"), member("g")]);
    makeRoom("RACING", { settings: settings(3), status: "racing" }, [member("h"), member("i")]);
    makeRoom("SECRET", { settings: settings(3), visibility: "semi_public" }, [member("j"), member("k")]);
    expect(rooms.pickQuickplayRoom(state.rooms.values(), "me")?.code).toBe("OLDEST");
  });

  test("no room gives no_public_room", () => {
    expect(rooms.quickplay(socket("me"))).toEqual({ ok: false, error: "no_public_room" });
  });
});

test("the rate limiter forgets old attempts", () => {
  const l = new limiter.RateLimiter(2, 1000);
  l.hit("ip", 0);
  l.hit("ip", 10);
  expect(l.limited("ip", 20)).toBe(true);
  expect(l.limited("ip", 1500)).toBe(false);
});
