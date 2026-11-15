import mongoose from "mongoose";
import { PRIVACY_POLICY_VERSION } from "../../common/constants/privacyPolicy.js";

const userConsentSchema = new mongoose.Schema(
  {
    subject_id: {
      type: String,
      required: true,
      trim: true,
    },
    subject_type: {
      type: String,
      enum: ["user", "anonymous"],
      required: true,
      default: "user",
    },
    consent_status: {
      type: String,
      enum: ["granted", "denied"],
      required: true,
      default: "granted",
    },
    consent_choice: {
      type: String,
      enum: ["UNKNOWN", "ESSENTIAL_ONLY", "CUSTOM", "ALL_ACCEPTED", "WITHDRAWN", "RECONSENT_REQUIRED"],
      default: "ESSENTIAL_ONLY",
    },
    categories: {
      necessary: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      personalization: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    policy_version: {
      type: String,
      default: PRIVACY_POLICY_VERSION,
    },
    source: {
      type: String,
      default: "banner",
    },
    // Durable Deletion Fence / Watermark:
    // Mọi event có timestamp <= cleared_at đều bị Worker drop vĩnh viễn,
    // ngăn ngừa triệt để việc replay hay khôi phục profile từ queue cũ bất kể thời gian trôi qua.
    cleared_at: {
      type: Date,
      default: null,
    },
    data_generation: {
      type: Number,
      default: 1,
    },
    // SHA-256 hash của anonymous_token để xác thực quyền sở hữu khi khách ẩn danh muốn xóa dữ liệu
    anonymous_token_hash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index: Đảm bảo duy nhất 1 bản ghi consent cho mỗi subject_id
userConsentSchema.index({ subject_id: 1 }, { unique: true });

const UserConsent = mongoose.model("user_consents", userConsentSchema);

export default UserConsent;
