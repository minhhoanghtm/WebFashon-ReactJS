import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import Order from "../modules/orders/order.model.js";

const getSocketActor = async (socket) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded?.role) return decoded;
    if (decoded?.userId) {
      const user = await User.findById(decoded.userId).select("role status").lean();
      if (user) {
        return { ...decoded, role: user.role, status: user.status };
      }
    }
    return decoded;
  } catch {
    return null;
  }
};

export const handleSocketEvents = (io, socket) => {
  import("../modules/communication/websocket/communication.socket.js")
    .then(({ registerCommunicationSocket }) => registerCommunicationSocket(io, socket))
    .catch((error) => console.error("Failed to register communication socket:", error.message));

  console.log(`🔌 Client connected: ${socket.id}`);

  // Join user room
  socket.on("join", async (userId) => {
    if (!userId) return;
    const actor = await getSocketActor(socket);
    if (!actor?.userId) return;
    if (actor.userId.toString() !== userId.toString() && actor.role !== "admin") return;
    if (userId) {
      const room = `user:${actor.userId}`;
      socket.join(room);
      console.log(`👤 User joined room: ${room}`);
    }
  });

  // An order room may only be joined by its owner or an administrator. This is
  // intentionally separate from the user room for pages showing one order.
  socket.on("order:join", async (orderId, callback) => {
    try {
      const actor = await getSocketActor(socket);
      if (!actor?.userId || !orderId) throw new Error("Chưa xác thực");

      const order = await Order.findById(orderId).select("user_id").lean();
      const isOwner = order?.user_id && String(order.user_id) === String(actor.userId);
      if (!order || (!isOwner && actor.role !== "admin")) {
        throw new Error("Bạn không có quyền theo dõi đơn hàng này");
      }

      const room = `order:${order._id}`;
      socket.join(room);
      callback?.({ success: true, room });
    } catch (error) {
      socket.emit("order:error", { success: false, message: error.message });
      callback?.({ success: false, message: error.message });
    }
  });

  // Join admin room
  socket.on("joinAdmin", async () => {
    const actor = await getSocketActor(socket);
    if (actor?.role !== "admin") return;
    socket.join("admin-room");
    console.log("👨‍💼 Admin joined room: admin-room");
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
};

const toOrderPayload = (order) => ({
  orderId: String(order._id),
  order: {
    _id: order._id,
    status: order.status,
    payment_status: order.payment_status,
    updatedAt: order.updatedAt,
    paid_at: order.paid_at,
  },
});

export const emitOrderEvent = (socketServer, event, order) => {
  const payload = toOrderPayload(order);
  socketServer.to("admin-room").emit(event, payload);
  if (order.user_id) {
    socketServer.to(`user:${order.user_id}`).emit(event, payload);
  }
  socketServer.to(`order:${order._id}`).emit(event, payload);
};

const emitWithSocketServer = async (event, order) => {
  try {
    const { getSocketIO } = await import("./index.js");
    emitOrderEvent(getSocketIO(), event, order);
    console.log(`📢 Emitted ${event} for order ${order._id}`);
  } catch (error) {
    console.error(`Failed to emit ${event}:`, error.message);
  }
};

export const emitOrderCreated = (order) => emitWithSocketServer("order:created", order);
export const emitOrderStatusChanged = (order) => emitWithSocketServer("order:status_changed", order);
export const emitPaymentUpdated = (order) => emitWithSocketServer("payment:updated", order);

// Compatibility wrapper for existing order-creation call sites.
export const emitOrderNotification = emitOrderCreated;
