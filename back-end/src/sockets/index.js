import { Server } from "socket.io";
import { handleSocketEvents } from "./events.js";
import { isOriginAllowed } from "../app.js";

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
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
