import mongoose from "mongoose";

const dataSubjectRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["EXPORT", "ERASURE", "RESTRICT", "OBJECT"], required: true },
  status: { type: String, enum: ["completed", "pending", "rejected"], default: "pending", index: true },
  requested_at: { type: Date, default: Date.now },
  processed_at: { type: Date, default: null },
  // Keep only a short administrative reason; do not put personal data in this field.
  reason: { type: String, maxlength: 500, default: null },
  result: { type: String, maxlength: 200, default: null },
}, { timestamps: true, versionKey: false });

dataSubjectRequestSchema.index({ user_id: 1, requested_at: -1 });
export default mongoose.models.DataSubjectRequest || mongoose.model("DataSubjectRequest", dataSubjectRequestSchema);
