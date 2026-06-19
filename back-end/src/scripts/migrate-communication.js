import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import LegacyConversation from "../modules/conversations/conversation.model.js";
import LegacyMessage from "../modules/messages/message.model.js";
import Conversation from "../modules/communication/conversations/conversation.model.js";
import Message from "../modules/communication/messages/message.model.js";

dotenv.config();

const mapStatus = (status) => {
  if (status === "active") return "open";
  if (status === "closed") return "closed";
  return "open";
};

const mapSenderType = (role) => {
  if (role === "assistant") return "ai";
  if (role === "admin") return "admin";
  return "user";
};

const migrate = async () => {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const legacyConversations = await LegacyConversation.find({}).lean();
    const conversationIdMap = new Map();

    for (const legacy of legacyConversations) {
      const existing = await Conversation.findOne({
        "metadata.legacyConversationId": legacy._id,
      }).session(session);

      if (existing) {
        conversationIdMap.set(String(legacy._id), existing._id);
        continue;
      }

      const created = await Conversation.create(
        [
          {
            customerId: legacy.user,
            type: legacy.type || "ai",
            status: mapStatus(legacy.status),
            assignedAdminId: null,
            source: "manual",
            metadata: {
              legacyConversationId: legacy._id,
              legacyTitle: legacy.title,
              legacyLastMessage: legacy.lastMessage,
            },
            lastMessageAt: legacy.lastMessageAt || legacy.updatedAt,
            createdAt: legacy.createdAt,
            updatedAt: legacy.updatedAt,
          },
        ],
        { session }
      );

      conversationIdMap.set(String(legacy._id), created[0]._id);
    }

    const legacyMessages = await LegacyMessage.find({}).lean();
    for (const legacyMessage of legacyMessages) {
      const newConversationId = conversationIdMap.get(String(legacyMessage.conversation));
      if (!newConversationId) continue;

      const existingMessage = await Message.findOne({
        "metadata.legacyMessageId": legacyMessage._id,
      }).session(session);
      if (existingMessage) continue;

      await Message.create(
        [
          {
            conversationId: newConversationId,
            senderType: mapSenderType(legacyMessage.role),
            senderId: null,
            messageType: "text",
            content: legacyMessage.content,
            metadata: {
              ...legacyMessage.metadata,
              legacyMessageId: legacyMessage._id,
            },
            createdAt: legacyMessage.createdAt,
            updatedAt: legacyMessage.updatedAt,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    console.log(`Migrated ${conversationIdMap.size} conversations and ${legacyMessages.length} messages.`);
  } catch (error) {
    await session.abortTransaction();
    console.error("Communication migration failed:", error);
    process.exitCode = 1;
  } finally {
    session.endSession();
    await mongoose.connection.close();
  }
};

migrate();
