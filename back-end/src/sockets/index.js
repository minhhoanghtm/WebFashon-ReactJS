import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { handleSocketEvents } from "./events.js";
import { isOriginAllowed } from "../app.js";
import { getRedisConnection } from "../configs/redis.js";

let io = null;

const REDIS_READY_TIMEOUT_MS = 5_000;

const waitForRedisReady = (client, name) => {
  if (client.status === "ready") return Promise.resolve();
  if (client.status === "end") return Promise.reject(new Error(`${name} Redis client is closed`));

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`${name} Redis client was not ready within ${REDIS_READY_TIMEOUT_MS}ms`));
    }, REDIS_READY_TIMEOUT_MS);
    const cleanup = () => {
      clearTimeout(timeout);
      client.off("ready", onReady);
      client.off("error", onError);
    };
    const onReady = () => { cleanup(); resolve(); };
    const onError = (error) => { cleanup(); reject(error); };
    client.once("ready", onReady);
    client.once("error", onError);
  });
};

const configureRedisAdapter = async (socketServer) => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    throw new Error("Redis adapter requires REDIS_URL or REDIS_HOST");
  }

  const pubClient = getRedisConnection();
  const subClient = pubClient.duplicate();
  subClient.on("error", (error) => {
    console.error("❌ Socket.IO Redis subscriber error:", error.message);
  });

  try {
    await Promise.all([
      waitForRedisReady(pubClient, "Socket.IO publisher"),
      waitForRedisReady(subClient, "Socket.IO subscriber"),
    ]);
    socketServer.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Socket.IO Redis adapter initialized");
  } catch (error) {
    subClient.disconnect();
    throw error;
  }
};

export const initSocketServer = async (httpServer) => {
  io = new Server(httpServer, {
    // WebSocket-only transport avoids session affinity requirements when Nginx
    // balances connections across several API instances.
    transports: ["websocket"],
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    },
  });

  try {
    await configureRedisAdapter(io);
  } catch (error) {
    const redisAdapterRequired =
      process.env.NODE_ENV === "production" ||
      process.env.SOCKET_REDIS_ADAPTER_REQUIRED === "true";
    if (redisAdapterRequired) {
      io.close();
      io = null;
      throw new Error(`Socket.IO Redis adapter is required in production: ${error.message}`);
    }
    console.warn(`⚠️ Socket.IO is using the in-memory adapter: ${error.message}`);
  }

  io.on("connection", (socket) => {
    handleSocketEvents(io, socket);
  });

  console.log("✅ Socket.IO Server initialized");
  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized yet!");
  }
  return io;
};
