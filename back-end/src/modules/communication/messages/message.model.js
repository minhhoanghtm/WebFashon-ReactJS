import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunicationConversation",
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ["user", "admin", "ai", "system"],
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "product_card", "order_card", "system"],
      required: true,
      default: "text",
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, senderType: 1, createdAt: -1 });
MessageSchema.index({ messageType: 1, createdAt: -1 });

const CommunicationMessage = mongoose.model("CommunicationMessage", MessageSchema);
export default CommunicationMessage;
