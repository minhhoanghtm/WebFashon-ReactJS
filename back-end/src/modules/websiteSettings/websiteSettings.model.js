import mongoose from "mongoose";

const websiteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "default",
      unique: true,
      required: true,
      index: true,
    },
    general: {
      siteName: { type: String, default: "Web Fashion" },
      siteDescription: { type: String, default: "Cửa hàng thời trang cao cấp" },
      logoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      hotline: { type: String, default: "0900000000" },
      email: { type: String, default: "contact@404Studio.com" },
      address: { type: String, default: "Hà Nội, Việt Nam" },
      workingHours: { type: String, default: "8:00 - 22:00" },
    },
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      metaKeywords: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
    system: {
      maintenanceMode: { type: Boolean, default: false },
      allowGuestCheckout: { type: Boolean, default: true },
      enableVoucher: { type: Boolean, default: true },
      enableReviews: { type: Boolean, default: true },
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
      zalo: { type: String, default: "" },
    },
    footer: {
      companyName: { type: String, default: "" },
      taxCode: { type: String, default: "" },
      copyrightText: { type: String, default: "" },
    },
    integrations: {
      facebookPixel: { type: String, default: "" },
      googleAnalytics: { type: String, default: "" },
      googleTagManager: { type: String, default: "" },
      chatbotScript: { type: String, default: "" },
    },
    // Audit fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const WebsiteSettings = mongoose.model("WebsiteSettings", websiteSettingsSchema, "website_settings");

export default WebsiteSettings;
