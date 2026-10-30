import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";
import { getRedisConnection } from "../configs/redis.js";

dotenv.config();

const run = async () => {
  let redis;
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    // Initialize Redis
    redis = getRedisConnection();
    console.log("Connected to Redis!");

    // Admin details found earlier
    const adminId = "6a3d49e1a7ea0400413dc80b";
    const jti = crypto.randomUUID();

    // Generate JWT
    const accessToken = jwt.sign(
      { userId: adminId, jti },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    // Whitelist in Redis
    await redis.set(`at:${jti}`, String(adminId), "EX", 1800);
    console.log("Whitelisted token in Redis successfully!");

    // Mock frontend settings payload (including id, _id, timestamps, etc.)
    const settingsPayload = {
      id: "6a3d3f32d3dfa7585adfd2d1",
      _id: "6a3d3f32d3dfa7585adfd2d1",
      createdAt: "2026-06-25T14:46:10.614Z",
      updatedAt: "2026-06-26T12:49:53.885Z",
      __v: 0,
      general: {
        siteName: "Web Fashion Test Live",
        siteDescription: "Mô tả cửa hàng thời trang cao cấp của chúng tôi",
        logoUrl: "https://example.com/logo.png",
        faviconUrl: "https://example.com/favicon.png",
        hotline: "0900000000",
        email: "contact@404Studio.com",
        address: "Hà Nội, Việt Nam",
        workingHours: "9:00 - 21:00",
      },
      seo: {
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        ogImage: "",
      },
      system: {
        maintenanceMode: false,
        allowGuestCheckout: true,
        enableVoucher: true,
        enableReviews: true,
      },
      socialLinks: {
        facebook: "",
        instagram: "",
        tiktok: "",
        youtube: "",
        zalo: "",
      },
      footer: {
        companyName: "",
        taxCode: "",
        copyrightText: "",
      },
      integrations: {
        facebookPixel: "",
        googleAnalytics: "",
        googleTagManager: "",
        chatbotScript: "",
      }
    };

    console.log("Sending PUT request to http://localhost:5000/api/settings...");
    const response = await axios.put("http://localhost:5000/api/settings", settingsPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("SUCCESS! Response:", response.data);

    // Clean up
    await redis.del(`at:${jti}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("ERROR during live save request!");
    if (err.response) {
      console.error("HTTP Status:", err.response.status);
      console.error("HTTP Headers:", err.response.headers);
      console.error("HTTP Body:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Error Message:", err.message);
    }
    if (redis) {
      try {
        await redis.quit();
      } catch (redisErr) {}
    }
    try {
      await mongoose.disconnect();
    } catch (dbErr) {}
    process.exit(1);
  }
};

run();
