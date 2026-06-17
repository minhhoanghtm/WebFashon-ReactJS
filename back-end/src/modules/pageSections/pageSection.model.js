import mongoose from "mongoose";

const pageSectionSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["hero", "story", "gallery", "quote", "image_text", "products", "banner", "cta"],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of sorted page sections
pageSectionSchema.index({ pageId: 1, order: 1 });

const PageSection = mongoose.model("PageSection", pageSectionSchema, "page_sections");

export { PageSection };
export default PageSection;
