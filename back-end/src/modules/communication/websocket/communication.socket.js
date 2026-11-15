import jwt from "jsonwebtoken";
import User from "../../users/user.model.js";
import supportChatService from "../supportChat/supportChat.service.js";
import conversationService from "../conversations/conversation.service.js";

const getSocketActor = (socket) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    return null;
  }
};

const getActorRole = async (actor) => {
  if (!actor?.userId) return null;
  if (actor.role) return actor.role;

  const user = await User.findById(actor.userId).select("role").lean();
  return user?.role || null;
};

export const registerCommunicationSocket = async (io, socket) => {
  const actor = getSocketActor(socket);
  const actorRole = await getActorRole(actor);

  if (actor?.userId) {
    socket.join(`customer:${actor.userId}`);
    socket.join(`admin:${actor.userId}`);
  }

  if (actorRole === "admin") {
    socket.join("admins");
  }

  socket.on("conversation:join", async (conversationId, callback) => {
    try {
      if (!actor?.userId) throw new Error("Unauthenticated socket");
      if (!conversationId) throw new Error("conversationId is required");

      // Authorization must happen before joining, otherwise an authenticated
      // customer could listen to another customer's conversation room.
      await conversationService.getConversationById(conversationId, {
        userId: actor.userId,
        role: actorRole,
      });
      socket.join(`conversation:${conversationId}`);
      callback?.({ success: true });
    } catch (error) {
      const payload = { success: false, message: error.message || "Forbidden conversation room" };
      socket.emit("conversation:error", payload);
      callback?.(payload);
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    if (conversationId) socket.leave(`conversation:${conversationId}`);
  });

  socket.on("message:send", async (payload, callback) => {
    try {
      if (!actor?.userId) throw new Error("Unauthenticated socket");

      const result =
        actorRole === "admin"
          ? await supportChatService.sendAdminMessage(actor.userId, payload)
          : await supportChatService.sendCustomerMessage(actor.userId, payload);

      const messagePayload = { message: result.message, conversation: result.conversation };
      io.to(`conversation:${result.conversationId}`).emit("message:new", messagePayload);

      if (actorRole !== "admin") {
        io.to("admins").emit("message:new", messagePayload);
      }

      callback?.({ success: true, data: result });
    } catch (error) {
      callback?.({ success: false, message: error.message });
    }
  });
};
