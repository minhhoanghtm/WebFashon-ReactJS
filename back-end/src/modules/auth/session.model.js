import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Tự động xóa document khi hết hạn
sessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
