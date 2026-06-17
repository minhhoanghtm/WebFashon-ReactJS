import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "about",
        "policy",
        "faq",
        "guide",
        "lookbook",
        "landing",
        "blog"
      ],
      required: true,
    },
    excerpt: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
    },
    bannerUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "archived"
      ],
      default: "draft",
    },
    seoTitle: {
      type: String,
      default: "",
      trim: true,
    },
    seoDescription: {
      type: String,
      default: "",
      trim: true,
    },
    seoKeywords: {
      type: String,
      default: "",
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Page = mongoose.model("Page", pageSchema, "pages");

export { Page };
export default Page;
