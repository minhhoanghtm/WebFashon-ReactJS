export const handleSocketEvents = (io, socket) => {
  import("../modules/communication/websocket/communication.socket.js")
    .then(({ registerCommunicationSocket }) => registerCommunicationSocket(io, socket))
    .catch((error) => console.error("Failed to register communication socket:", error.message));

  console.log(`🔌 Client connected: ${socket.id}`);

  // Join user room
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User joined room: ${userId}`);
    }
  });

  // Join admin room
  socket.on("joinAdmin", () => {
    socket.join("admin-room");
    console.log("👨‍💼 Admin joined room: admin-room");
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
};

export const emitOrderNotification = async (order) => {
  try {
    const { getSocketIO } = await import("./index.js");
    const io = getSocketIO();

    // Gửi thông báo cho Admin
    io.to("admin-room").emit("newOrder", {
      message: `Đơn hàng mới #${order._id} vừa được tạo!`,
      order,
    });

    // Gửi thông báo cho User cụ thể
    if (order.user_id) {
      io.to(order.user_id.toString()).emit("orderUpdated", {
        message: `Đơn hàng của bạn đã được cập nhật trạng thái: ${order.status}`,
        order,
      });
    }
  } catch (err) {
    console.error("❌ Failed to emit socket event:", err.message);
  }
};
