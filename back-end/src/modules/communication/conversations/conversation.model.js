import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ai", "support"],
      required: true,
      default: "ai",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "waiting_admin", "waiting_customer", "closed"],
      required: true,
      default: "open",
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "ai_handoff"],
      required: true,
      default: "manual",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ customerId: 1, status: 1, lastMessageAt: -1 });
ConversationSchema.index({ assignedAdminId: 1, status: 1, lastMessageAt: -1 });
ConversationSchema.index({ type: 1, status: 1, source: 1, lastMessageAt: -1 });
ConversationSchema.index({ status: 1, assignedAdminId: 1, createdAt: -1 });

const CommunicationConversation = mongoose.model("CommunicationConversation", ConversationSchema);
export default CommunicationConversation;
