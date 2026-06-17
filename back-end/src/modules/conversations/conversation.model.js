import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["ai", "support"],
      default: "ai",
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    title: String,
    lastMessage: String,
    lastMessageAt: Date,
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ user: 1, status: 1, updatedAt: -1 });
ConversationSchema.index({ type: 1, status: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;
