import mongoose from "mongoose";
import messageRepository from "./message.repository.js";
import conversationService from "../conversations/conversation.service.js";
import { ValidationError } from "../errors/communication.errors.js";
import { validateCreateMessageDto } from "../validators/communication.validator.js";

const assertObjectId = (id, field = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`${field} is invalid`);
  }
};

class MessageService {
  async findByClientMessageId(senderId, clientMessageId) {
    if (!senderId || !clientMessageId) return null;
    return messageRepository.findOne({ senderId, clientMessageId });
  }

  async createMessage(payload, actor = {}, options = {}) {
    const { skipConversationCheck = false, ...repositoryOptions } = options;
    const data = validateCreateMessageDto(payload);
    assertObjectId(data.conversationId, "conversationId");
    if (data.senderId) assertObjectId(data.senderId, "senderId");

    if (!skipConversationCheck) {
      await conversationService.getConversationById(data.conversationId, actor);
    }

    const existing = await this.findByClientMessageId(data.senderId, data.clientMessageId);
    if (existing) return existing;

    let message;
    try {
      message = await messageRepository.create(data, repositoryOptions);
    } catch (error) {
      // The unique index is the race-safe guard when two retries arrive together.
      if (error?.code !== 11000 || !data.clientMessageId) throw error;
      message = await this.findByClientMessageId(data.senderId, data.clientMessageId);
      if (!message) throw error;
    }
    const nextStatus =
      data.senderType === "user"
        ? "waiting_admin"
        : data.senderType === "admin" || data.senderType === "ai"
          ? "waiting_customer"
          : undefined;

    if (!skipConversationCheck) {
      await conversationService.markLastMessage(data.conversationId, message.createdAt, nextStatus);
    }
    return message;
  }

  async listMessages(conversationId, actor = {}, query = {}) {
    assertObjectId(conversationId, "conversationId");
    await conversationService.getConversationById(conversationId, actor);

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { conversationId };
    const cursor = query.cursor || query.after;
    if (cursor) {
      const after = new Date(cursor);
      if (Number.isNaN(after.getTime())) throw new ValidationError("cursor is invalid");
      filter.createdAt = { $gt: after };
    }

    const [items, total] = await Promise.all([
      messageRepository.find(filter, { skip, limit }),
      messageRepository.count(filter),
    ]);

    const lastItem = items[items.length - 1];
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      nextCursor: lastItem?.createdAt ? new Date(lastItem.createdAt).toISOString() : null,
    };
  }

  async copyConversationMessages(sourceConversationId, targetConversationId, options = {}) {
    const messages = await messageRepository.find(
      { conversationId: sourceConversationId },
      { limit: 500, sort: { createdAt: 1 } }
    );

    if (!messages.length) return [];

    return messageRepository.insertMany(
      messages.map((message) => ({
        conversationId: targetConversationId,
        senderType: message.senderType,
        senderId: message.senderId,
        messageType: message.messageType,
        content: message.content,
        metadata: message.metadata,
      })),
      options
    );
  }
}

export default new MessageService();
