import conversationService from "../conversations/conversation.service.js";
import messageService from "../messages/message.service.js";
import { validateTextMessageDto } from "../validators/communication.validator.js";
import { ValidationError } from "../errors/communication.errors.js";

class SupportChatService {
  async sendCustomerMessage(userId, payload) {
    const data = validateTextMessageDto(payload);
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
      },
      { userId, role: "user" }
    );

    return { conversationId, message };
  }

  async sendAdminMessage(adminId, payload) {
    const data = validateTextMessageDto(payload);
    if (!data.conversationId) throw new ValidationError("conversationId is required");

    const message = await messageService.createMessage(
      {
        conversationId: data.conversationId,
        senderType: "admin",
        senderId: adminId,
        messageType: "text",
        content: data.content,
        metadata: data.metadata,
      },
      { userId: adminId, role: "admin" }
    );

    return { conversationId: data.conversationId, message };
  }
}

export default new SupportChatService();
