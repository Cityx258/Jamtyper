import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { auth } from "../src/lib/auth";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../src/lib/room-protocol";
import {
  closeStaleRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  type AppServer,
  type Identity,
} from "./rooms";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const httpServer = createServer();
const app = next({
  dev,
  // Used for URL generation only; the server itself listens on every interface.
  hostname: dev ? "localhost" : "0.0.0.0",
  port,
  httpServer,
});
const handle = app.getRequestHandler();

const GUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

async function main() {
  await closeStaleRooms();
  await app.prepare();
  httpServer.on("request", (req, res) => void handle(req, res));

  const io: AppServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents
  >(httpServer, {
    // Next's dev server upgrades its own HMR websocket on this same HTTP server.
    destroyUpgrade: false,
    // Browsers don't apply CORS to WebSocket upgrades, so refuse any page that
    // isn't served from this host (otherwise another site could drive a logged-in
    // user's socket).
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
    socket.on("room:create", async (ack) => {
      if (typeof ack !== "function") return;
      try {
        ack(await createRoom(io, socket));
      } catch (e) {
        console.error("[socket] room:create", e);
        ack({ ok: false, error: "server_error" });
      }
    });

    socket.on("room:join", async (payload, ack) => {
      if (typeof ack !== "function") return;
      try {
        ack(await joinRoom(io, socket, payload?.code, payload?.guestName));
      } catch (e) {
        console.error("[socket] room:join", e);
        ack({ ok: false, error: "server_error" });
      }
    });

    socket.on("room:leave", async (ack) => {
      try {
        await leaveRoom(io, socket, { immediate: true });
      } catch (e) {
        console.error("[socket] room:leave", e);
      }
      if (typeof ack === "function") ack();
    });

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
