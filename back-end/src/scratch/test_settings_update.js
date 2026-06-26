import mongoose from "mongoose";
import dotenv from "dotenv";
import websiteSettingsService from "../modules/websiteSettings/websiteSettings.service.js";
import WebsiteSettings from "../modules/websiteSettings/websiteSettings.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    // Fetch existing settings
    const settings = await WebsiteSettings.findOne({ singletonKey: "default" });
    console.log("Current Settings in DB:", JSON.stringify(settings, null, 2));

    // Try a mock update matching what the frontend sends
    const mockPayload = {
      id: "6a3d3f32d3dfa7585adfd2d1",
      _id: "6a3d3f32d3dfa7585adfd2d1",
      createdAt: "2026-06-25T14:46:10.614Z",
      updatedAt: "2026-06-26T12:49:53.885Z",
      __v: 0,
      general: {
        siteName: "Web Fashion Test",
        siteDescription: "Mô tả cửa hàng thời trang",
        logoUrl: settings?.general?.logoUrl || "",
        faviconUrl: settings?.general?.faviconUrl || "",
        hotline: "0900000000",
        email: "contact@404Studio.com",
        address: "Thành phố Hồ Chí Minh, Việt Nam",
        workingHours: "8:00 - 22:00",
      },
      seo: {
        metaTitle: "Web Fashion Test Title",
        metaDescription: "Mô tả SEO",
        metaKeywords: "thoi trang",
        ogImage: "",
      },
      system: {
        maintenanceMode: false,
        allowGuestCheckout: true,
        enableVoucher: true,
        enableReviews: true,
      },
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        tiktok: "",
        youtube: "",
        zalo: "",
      },
      footer: {
        companyName: "Công ty Test",
        taxCode: "123456",
        copyrightText: "© 2026 Test",
      },
      integrations: {
        facebookPixel: "",
        googleAnalytics: "",
        googleTagManager: "",
        chatbotScript: "",
      }
    };

    console.log("Attempting service.updateSettings...");
    const updated = await websiteSettingsService.updateSettings("6582a933f81cb4bc10255a2a", mockPayload);
    console.log("Update settings returned:", JSON.stringify(updated, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error running test:", err);
    await mongoose.disconnect();
  }
};

run();
