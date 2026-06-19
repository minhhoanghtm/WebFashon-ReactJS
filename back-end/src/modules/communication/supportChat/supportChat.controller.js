import supportChatService from "./supportChat.service.js";
import { successResponse } from "../../../common/responses/index.js";

const emitSupportMessage = async (data, { notifyAdmins = false } = {}) => {
  try {
    const { getSocketIO } = await import("../../../sockets/index.js");
    const io = getSocketIO();
    io.to(`conversation:${data.conversationId}`).emit("message:new", data.message);
    if (notifyAdmins) {
      io.to("admins").emit("message:new", data.message);
    }
  } catch (error) {
    console.error("Failed to emit support chat message:", error.message);
  }
};

export const sendCustomerSupportMessage = async (req, res, next) => {
  try {
    const data = await supportChatService.sendCustomerMessage(req.user.userId, req.body);
    await emitSupportMessage(data, { notifyAdmins: true });
    return successResponse(res, data, "Support message sent successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const sendAdminSupportMessage = async (req, res, next) => {
  try {
    const data = await supportChatService.sendAdminMessage(req.user.userId, req.body);
    await emitSupportMessage(data);
    return successResponse(res, data, "Admin support message sent successfully", 201);
  } catch (error) {
    next(error);
  }
};
