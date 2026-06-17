import mongoose from "mongoose";
import { AppError } from "../../common/exceptions/AppError.js";
import conversationService from "../conversations/conversation.service.js";
import messageRepository from "./message.repository.js";

const ensureObjectId = (id, message = "ID khong hop le") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400);
  }
};

class MessageService {
  async getMessages(conversationId, userId, query = {}, isAdmin = false) {
    ensureObjectId(conversationId, "ID hoi thoai khong hop le");
    await conversationService.getConversationById(conversationId, userId, isAdmin);

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { conversation: conversationId };

    const [items, total] = await Promise.all([
      messageRepository.find(filter, { createdAt: 1 }, skip, limit),
      messageRepository.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createMessage(userId, payload = {}, isAdmin = false) {
    const { conversation, content, metadata } = payload;
    ensureObjectId(conversation, "ID hoi thoai khong hop le");

    if (!content || !String(content).trim()) {
      throw new AppError("Noi dung tin nhan la bat buoc", 400);
    }

    await conversationService.getConversationById(conversation, userId, isAdmin);

    const role = isAdmin ? payload.role || "admin" : "user";
    if (!["user", "assistant", "admin"].includes(role)) {
      throw new AppError("Vai tro tin nhan khong hop le", 400);
    }

    if (!isAdmin && role !== "user") {
      throw new AppError("Nguoi dung chi co the gui tin nhan voi role user", 403);
    }

    const message = await messageRepository.create({
      conversation,
      role,
      content: String(content).trim(),
      metadata,
    });

    await conversationService.touchLastMessage(conversation, message.content);

    return message;
  }
}

export default new MessageService();
