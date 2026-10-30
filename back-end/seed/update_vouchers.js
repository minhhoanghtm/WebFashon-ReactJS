import mongoose from "mongoose";
import dotenv from "dotenv";
import Voucher from "../src/modules/vouchers/voucher.model.js";
import WebsiteSettings from "../src/modules/websiteSettings/websiteSettings.model.js";

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_CONNECTIONSTRING;

    if (!mongoUri) {
      throw new Error("MONGO_CONNECTIONSTRING is not defined in the .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB");

    // Fetch site settings
    const settings = await WebsiteSettings.findOne({ singletonKey: "default" });
    const siteName = settings?.general?.siteName || "Web Fashion";
    console.log(`🌐 Tên shop hiện tại trong DB: "${siteName}"`);

    const cleanCodePart = siteName.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Fetch all vouchers
    const vouchers = await Voucher.find();
    console.log(`📋 Tìm thấy ${vouchers.length} vouchers trong DB.`);

    let updatedCount = 0;
    for (const voucher of vouchers) {
      let isUpdated = false;

      // Update name
      if (voucher.name && voucher.name.includes("404Studio")) {
        voucher.name = voucher.name.replace(/404Studio/g, siteName);
        isUpdated = true;
      }

      // Update description
      if (voucher.description && voucher.description.includes("404Studio")) {
        voucher.description = voucher.description.replace(/404Studio/g, siteName);
        isUpdated = true;
      } else if (voucher.description && voucher.description.includes("PetShop")) {
        voucher.description = voucher.description.replace(/PetShop/g, siteName);
        isUpdated = true;
      }

      // Update code
      if (voucher.code === "WELCOMETO404") {
        voucher.code = `WELCOME${cleanCodePart}`;
        isUpdated = true;
      } else if (voucher.code === "404XINCHAO") {
        voucher.code = `${cleanCodePart}XINCHAO`;
        isUpdated = true;
      }

      if (isUpdated) {
        await voucher.save();
        console.log(`✅ Đã cập nhật voucher: "${voucher.code}" - "${voucher.name}"`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Đã cập nhật thành công ${updatedCount} voucher trong DB!`);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật DB:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }
};

run();
