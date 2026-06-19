import messageRepository from "../messages/message.repository.js";

class AiChatRepository {
  getRecentMessages(conversationId, limit = 20) {
    return messageRepository.find(
      { conversationId },
      { sort: { createdAt: -1 }, limit }
    );
  }
}

export default new AiChatRepository();
