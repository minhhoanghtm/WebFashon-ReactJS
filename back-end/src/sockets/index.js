import { Server } from "socket.io";
import { handleSocketEvents } from "./events.js";

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:3000",
      ].filter(Boolean),
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
