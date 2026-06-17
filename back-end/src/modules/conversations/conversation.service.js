import mongoose from "mongoose";
import { AppError } from "../../common/exceptions/AppError.js";
import conversationRepository from "./conversation.repository.js";

const userPopulate = {
  path: "user",
  select: "fullName email avatar_url",
};

const ensureObjectId = (id, message = "ID khong hop le") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400);
  }
};

class ConversationService {
  async createConversation(userId, payload = {}) {
    const conversation = await conversationRepository.create({
      user: userId,
      type: payload.type || "ai",
      status: payload.status || "active",
      title: payload.title,
      lastMessage: payload.lastMessage,
      lastMessageAt: payload.lastMessage ? new Date() : payload.lastMessageAt,
    });

    return conversation;
  }

  async getMyConversations(userId, query = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { user: userId };

    if (["ai", "support"].includes(query.type)) filter.type = query.type;
    if (["active", "closed"].includes(query.status)) filter.status = query.status;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { lastMessageAt: -1, updatedAt: -1 }, skip, limit, userPopulate),
      conversationRepository.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminConversations(query = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};

    if (["ai", "support"].includes(query.type)) filter.type = query.type;
    if (["active", "closed"].includes(query.status)) filter.status = query.status;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { lastMessageAt: -1, updatedAt: -1 }, skip, limit, userPopulate),
      conversationRepository.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getConversationById(conversationId, userId, isAdmin = false) {
    ensureObjectId(conversationId, "ID hoi thoai khong hop le");

    const conversation = await conversationRepository.findByIdLean(conversationId, userPopulate);
    if (!conversation) {
      throw new AppError("Hoi thoai khong ton tai", 404);
    }

    if (!isAdmin && String(conversation.user) !== String(userId)) {
      throw new AppError("Ban khong co quyen truy cap hoi thoai nay", 403);
    }

    return conversation;
  }

  async updateConversation(conversationId, userId, payload = {}, isAdmin = false) {
    const conversation = await this.getConversationById(conversationId, userId, isAdmin);
    const updateData = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (["ai", "support"].includes(payload.type)) updateData.type = payload.type;
    if (["active", "closed"].includes(payload.status)) updateData.status = payload.status;

    if (!Object.keys(updateData).length) return conversation;

    return await conversationRepository.findByIdAndUpdate(conversationId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async closeConversation(conversationId, userId, isAdmin = false) {
    await this.getConversationById(conversationId, userId, isAdmin);

    return await conversationRepository.findByIdAndUpdate(
      conversationId,
      { status: "closed" },
      { new: true, runValidators: true }
    );
  }

  async touchLastMessage(conversationId, content) {
    return await conversationRepository.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
      { new: true }
    );
  }
}

export default new ConversationService();
