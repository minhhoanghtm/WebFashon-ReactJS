import { io } from "socket.io-client";
import { ENV } from "../config/env";

let globalSocket = null;

export const getAppSocket = () => {
  if (!globalSocket) {
    const socketUrl = ENV.API_BASE_URL ? ENV.API_BASE_URL.replace(/\/api\/?$/, "") : "http://localhost:5000";
    globalSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
    });
  }
  return globalSocket;
};
