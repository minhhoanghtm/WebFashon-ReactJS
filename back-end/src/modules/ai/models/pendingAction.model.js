import mongoose from "mongoose";

// Server-owned confirmation record.  The client only ever receives the id and
// digest; normalized parameters remain authoritative in this document.
const pendingActionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    tool: { type: String, required: true, enum: ["add_to_cart", "update_cart_item", "remove_cart_item", "update_profile", "prepare_checkout", "start_checkout", "buy_now", "cancel_checkout", "place_order"] },
    params: { type: mongoose.Schema.Types.Mixed, required: true },
    summary: { type: mongoose.Schema.Types.Mixed, required: true },
    paramsHash: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "expired", "failed"], default: "pending", index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

pendingActionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

export default mongoose.models.AiPendingAction || mongoose.model("AiPendingAction", pendingActionSchema);
