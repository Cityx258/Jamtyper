import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { z } from "zod";
import { settingsPatchSchema } from "../src/lib/race-settings";
import {
  approveSchema,
  createRoomSchema,
  joinRoomSchema,
  memberSchema,
  noteSchema,
  progressSchema,
  teamSchema,
  visibilitySchema,
  watchSchema,
} from "../src/lib/schemas";
import { auth } from "../src/lib/auth";
import { decodeGuest, GUEST_COOKIE, readCookie } from "../src/lib/guest-cookie";
import type {
  ActionResult,
  ClientToServerEvents,
  RoomError,
  ServerToClientEvents,
} from "../src/lib/room-protocol";
import {
  answerWatchRequest,
  kickMember,
  promoteMember,
  setNote,
  setTeam,
  setWatching,
} from "./members";
import {
  cancelRace,
  configureRoom,
  forfeit,
  raceAgain,
  recordProgress,
  startRace,
} from "./race";
import { loadCorpus } from "./corpus";
import { EXPLORER, publicRooms, type AppSocket } from "./room-state";
import {
  closeRoomByHost,
  closeStaleRooms,
  createInvite,
  createRoom,
  joinRoom,
  listInvites,
  leaveRoom,
  quickplay,
  setVisibility,
  type AppServer,
  type Identity,
} from "./rooms";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const httpServer = createServer();
const app = next({
  dev,
  hostname: dev ? "localhost" : "0.0.0.0",
  port,
  httpServer,
});
const handle = app.getRequestHandler();

const MAX_MESSAGE_BYTES = 16_000;
const EVENTS_PER_SECOND = 40;

const badRequest = { ok: false, error: "bad_request" } as const;

const serverError = { ok: false, error: "server_error" } as const satisfies {
  ok: false;
  error: RoomError;
};

function clientIp(forwarded: string | string[] | undefined, address: string): string {
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const last = !dev && header ? (header.split(",").at(-1)?.trim() ?? "") : "";
  return last || address;
}

async function respond<T>(
  event: string,
  ack: unknown,
  run: (payload?: unknown) => T | Promise<T>,
  payload?: unknown,
) {
  if (typeof ack !== "function") return;
  const reply = ack as (result: T | typeof serverError) => void;
  try {
    reply(await run(payload));
  } catch (e) {
    console.error(`[socket] ${event}`, e);
    reply(serverError);
  }
}

async function main() {
  await closeStaleRooms();
  await loadCorpus();
  await app.prepare();
  httpServer.on("request", (req, res) => {
    if (!dev && req.headers["x-forwarded-proto"] === "http" && req.headers.host) {
      res.writeHead(301, { location: `https://${req.headers.host}${req.url ?? "/"}` });
      res.end();
      return;
    }
    void handle(req, res);
  });

  const io: AppServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents
  >(httpServer, {
    destroyUpgrade: false,
    maxHttpBufferSize: MAX_MESSAGE_BYTES,
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      if (!origin) return callback(null, true);
      try {
        callback(null, new URL(origin).host === req.headers.host);
      } catch {
        callback(null, false);
      }
    },
  });

  io.use(async (socket, nextMiddleware) => {
    try {
      const headers = new Headers();
      const cookie = socket.handshake.headers.cookie;
      if (cookie) headers.set("cookie", cookie);
      const session = await auth.api.getSession({ headers });

      const ip = clientIp(socket.handshake.headers["x-forwarded-for"], socket.handshake.address);
      let identity: Identity;
      if (session) {
        identity = {
          key: `user:${session.user.id}`,
          userId: session.user.id,
          name: session.user.displayUsername ?? session.user.name,
          image: session.user.image ?? null,
          ip,
        };
      } else {
        const guest = decodeGuest(readCookie(cookie, GUEST_COOKIE));
        identity = guest
          ? { key: `guest:${guest.id}`, userId: null, name: guest.name, image: null, ip }
          : { key: `anon:${socket.id}`, userId: null, name: "", image: null, ip };
      }
      socket.data.identity = identity;
      nextMiddleware();
    } catch (e) {
      console.error("[socket] auth failed", e);
      nextMiddleware(new Error("auth_failed"));
    }
  });

  io.on("connection", (socket) => {
    let windowStart = Date.now();
    let count = 0;
    socket.use((_packet, nextPacket) => {
      const now = Date.now();
      if (now - windowStart >= 1000) {
        windowStart = now;
        count = 0;
      }
      if (++count > EVENTS_PER_SECOND) return;
      nextPacket();
    });

    const guard =
      <S extends z.ZodType>(schema: S, run: (payload: z.output<S>) => unknown) =>
      (payload: unknown) => {
        const parsed = schema.safeParse(payload);
        return parsed.success ? run(parsed.data) : badRequest;
      };

    socket.on("room:create", (payload, ack) =>
      respond("room:create", ack, guard(createRoomSchema, (p) => createRoom(io, socket, p)), payload),
    );
    socket.on("room:join", (payload, ack) =>
      respond("room:join", ack, guard(joinRoomSchema, (p) => joinRoom(io, socket, p)), payload),
    );
    socket.on("room:quickplay", (ack) =>
      respond("room:quickplay", ack, () => quickplay(socket)),
    );
    socket.on("room:invites", (ack) => respond("room:invites", ack, () => listInvites(socket)));
    socket.on("explorer:watch", (ack) =>
      respond("explorer:watch", ack, () => {
        void socket.join(EXPLORER);
        return publicRooms();
      }),
    );
    socket.on("explorer:unwatch", () => void socket.leave(EXPLORER));
    socket.on("room:visibility", (payload, ack) =>
      respond(
        "room:visibility",
        ack,
        guard(visibilitySchema, (p) => setVisibility(io, socket, p)),
        payload,
      ),
    );
    socket.on("room:configure", (payload, ack) =>
      respond(
        "room:configure",
        ack,
        guard(settingsPatchSchema, (p) => configureRoom(io, socket, p)),
        payload,
      ),
    );
    socket.on("room:invite", (ack) =>
      respond("room:invite", ack, () => createInvite(io, socket)),
    );
    socket.on("member:watch", (payload, ack) =>
      respond("member:watch", ack, guard(watchSchema, (p) => setWatching(io, socket, p)), payload),
    );
    socket.on("member:approve", (payload, ack) =>
      respond(
        "member:approve",
        ack,
        guard(approveSchema, (p) => answerWatchRequest(io, socket, p)),
        payload,
      ),
    );
    socket.on("member:kick", (payload, ack) =>
      respond("member:kick", ack, guard(memberSchema, (p) => kickMember(io, socket, p)), payload),
    );
    socket.on("member:promote", (payload, ack) =>
      respond(
        "member:promote",
        ack,
        guard(memberSchema, (p) => promoteMember(io, socket, p)),
        payload,
      ),
    );
    socket.on("member:team", (payload, ack) =>
      respond("member:team", ack, guard(teamSchema, (p) => setTeam(io, socket, p)), payload),
    );
    socket.on("member:note", (payload, ack) =>
      respond("member:note", ack, guard(noteSchema, (p) => setNote(io, socket, p)), payload),
    );

    socket.on("room:leave", async (ack) => {
      try {
        await leaveRoom(io, socket, { immediate: true });
      } catch (e) {
        console.error("[socket] room:leave", e);
      }
      if (typeof ack === "function") ack();
    });

    const action = (
      event: "race:start" | "race:cancel" | "race:again" | "race:forfeit",
      run: (io: AppServer, socket: AppSocket) => ActionResult,
    ) => {
      socket.on(event, (ack) => respond(event, ack, () => run(io, socket)));
    };
    action("race:start", startRace);
    action("race:cancel", cancelRace);
    action("race:again", raceAgain);
    action("race:forfeit", forfeit);

    socket.on("race:progress", (payload) => {
      const parsed = progressSchema.safeParse(payload);
      if (!parsed.success) return;
      try {
        recordProgress(io, socket, parsed.data);
      } catch (e) {
        console.error("[socket] race:progress", e);
      }
    });

    socket.on("room:close", (ack) =>
      respond("room:close", ack, () => closeRoomByHost(io, socket)),
    );

    socket.on("disconnect", () => {
      leaveRoom(io, socket, { immediate: false }).catch((e) =>
        console.error("[socket] disconnect", e),
      );
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://localhost:${port} (${dev ? "development" : "production"})`,
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
