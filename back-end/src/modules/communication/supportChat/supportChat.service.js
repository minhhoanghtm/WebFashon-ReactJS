import conversationService from "../conversations/conversation.service.js";
import messageService from "../messages/message.service.js";
import { validateTextMessageDto } from "../validators/communication.validator.js";
import { ValidationError } from "../errors/communication.errors.js";

class SupportChatService {
  async sendCustomerMessage(userId, payload) {
    const data = validateTextMessageDto(payload);
    const existing = await messageService.findByClientMessageId(userId, data.clientMessageId);
    if (existing) {
      const conversation = await conversationService.getConversationById(existing.conversationId, { userId, role: "user" });
      return { conversationId: String(existing.conversationId), message: existing, conversation };
    }
    let conversationId = data.conversationId;

    if (!conversationId) {
      const conversation = await conversationService.createConversation({
        customerId: userId,
        type: "support",
        status: "waiting_admin",
        source: "manual",
        metadata: data.metadata,
      });
      conversationId = conversation._id;
    }

    const message = await messageService.createMessage(
      {
        conversationId,
        senderType: "user",
        senderId: userId,
        messageType: "text",
        content: data.content,
        metadata: data.metadata,
        clientMessageId: data.clientMessageId,
      },
      { userId, role: "user" }
    );

    const conversation = await conversationService.getConversationById(conversationId, {
      userId,
      role: "user",
    });
    return { conversationId: String(conversationId), message, conversation };
  }

  async sendAdminMessage(adminId, payload) {
    const data = validateTextMessageDto(payload);
    if (!data.conversationId) throw new ValidationError("conversationId is required");
    const existing = await messageService.findByClientMessageId(adminId, data.clientMessageId);
    if (existing) {
      const conversation = await conversationService.getConversationById(existing.conversationId, { userId: adminId, role: "admin" });
      return { conversationId: String(existing.conversationId), message: existing, conversation };
    }

    const message = await messageService.createMessage(
      {
        conversationId: data.conversationId,
        senderType: "admin",
        senderId: adminId,
        messageType: "text",
        content: data.content,
        metadata: data.metadata,
        clientMessageId: data.clientMessageId,
      },
      { userId: adminId, role: "admin" }
    );

    const conversation = await conversationService.getConversationById(data.conversationId, {
      userId: adminId,
      role: "admin",
    });
    return { conversationId: String(data.conversationId), message, conversation };
  }
}

export default new SupportChatService();
