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
  async createMessage(payload, actor = {}, options = {}) {
    const { skipConversationCheck = false, ...repositoryOptions } = options;
    const data = validateCreateMessageDto(payload);
    assertObjectId(data.conversationId, "conversationId");
    if (data.senderId) assertObjectId(data.senderId, "senderId");

    if (!skipConversationCheck) {
      await conversationService.getConversationById(data.conversationId, actor);
    }

    const message = await messageRepository.create(data, repositoryOptions);
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

    const [items, total] = await Promise.all([
      messageRepository.find(filter, { skip, limit }),
      messageRepository.count(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
