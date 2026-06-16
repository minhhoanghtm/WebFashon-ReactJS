import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    mobileImageUrl: {
      type: String,
      default: "",
    },
    linkUrl: {
      type: String,
      default: "",
    },
    buttonText: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["product", "category", "external"],
      default: "external",
    },
    targetId: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    // Audit fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Compound index for optimizing homepage queries
bannerSchema.index({ isDeleted: 1, isActive: 1, position: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
