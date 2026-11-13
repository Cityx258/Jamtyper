import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { auth } from "../src/lib/auth";
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
import type { AppSocket } from "./room-state";
import {
  closeRoomByHost,
  closeStaleRooms,
  createInvite,
  createRoom,
  joinRoom,
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

const GUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_MESSAGE_BYTES = 16_000;
const EVENTS_PER_SECOND = 40;

const serverError = { ok: false, error: "server_error" } as const satisfies {
  ok: false;
  error: RoomError;
};

async function respond<T>(
  event: string,
  ack: unknown,
  run: () => T | Promise<T>,
) {
  if (typeof ack !== "function") return;
  const reply = ack as (result: T | typeof serverError) => void;
  try {
    reply(await run());
  } catch (e) {
    console.error(`[socket] ${event}`, e);
    reply(serverError);
  }
}

async function main() {
  await closeStaleRooms();
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

      let identity: Identity;
      if (session) {
        identity = {
          key: `user:${session.user.id}`,
          userId: session.user.id,
          name: session.user.displayUsername ?? session.user.name,
        };
      } else {
        const sent = socket.handshake.auth?.guestId;
        const guestId =
          typeof sent === "string" && GUEST_ID.test(sent)
            ? sent
            : `anon-${socket.id}`;
        identity = {
          key: `guest:${guestId}`,
          userId: null,
          name: `Guest ${guestId.slice(-4).toUpperCase()}`,
        };
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

    socket.on("room:create", (ack) =>
      respond("room:create", ack, () => createRoom(io, socket)),
    );
    socket.on("room:join", (payload, ack) =>
      respond("room:join", ack, () =>
        joinRoom(
          io,
          socket,
          payload?.code,
          payload?.guestName,
          payload?.invite,
        ),
      ),
    );
    socket.on("room:quickplay", (ack) =>
      respond("room:quickplay", ack, () => quickplay(io, socket)),
    );
    socket.on("room:visibility", (payload, ack) =>
      respond("room:visibility", ack, () =>
        setVisibility(io, socket, payload),
      ),
    );
    socket.on("room:configure", (payload, ack) =>
      respond("room:configure", ack, () => configureRoom(io, socket, payload)),
    );
    socket.on("room:invite", (ack) =>
      respond("room:invite", ack, () => createInvite(socket)),
    );
    socket.on("member:watch", (payload, ack) =>
      respond("member:watch", ack, () => setWatching(io, socket, payload)),
    );
    socket.on("member:approve", (payload, ack) =>
      respond("member:approve", ack, () =>
        answerWatchRequest(io, socket, payload),
      ),
    );
    socket.on("member:kick", (payload, ack) =>
      respond("member:kick", ack, () => kickMember(io, socket, payload)),
    );
    socket.on("member:promote", (payload, ack) =>
      respond("member:promote", ack, () => promoteMember(io, socket, payload)),
    );
    socket.on("member:team", (payload, ack) =>
      respond("member:team", ack, () => setTeam(io, socket, payload)),
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
      try {
        recordProgress(io, socket, payload);
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
