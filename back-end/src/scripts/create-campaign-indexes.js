import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

/**
 * Script tạo Index cho module Chiến dịch giảm giá (Campaigns)
 * MẶC ĐỊNH: DRY-RUN (Chỉ hiển thị kế hoạch, KHÔNG ghi vào DB).
 * CHỈ GHI KHI CÓ THAM SỐ: --apply
 */

const INDEX_DEFINITIONS = [
  {
    collection: "campaigns",
    index: { slug: 1 },
    options: { unique: true, background: true, name: "uniq_slug" },
  },
  {
    collection: "campaigns",
    index: { status: 1, startAt: 1, endAt: 1 },
    options: { background: true, name: "idx_status_start_end" },
  },
  {
    collection: "campaigns",
    index: { isDeleted: 1, priority: -1 },
    options: { background: true, name: "idx_isDeleted_priority" },
  },
  {
    collection: "campaignproducts",
    index: { campaign_id: 1, product_id: 1, variant_id: 1 },
    options: { unique: true, background: true, name: "uniq_campaign_prod_var" },
  },
  {
    collection: "campaignproducts",
    index: { product_id: 1, campaign_id: 1 },
    options: { background: true, name: "idx_prod_campaign" },
  },
  {
    collection: "campaignpurchases",
    index: { order_id: 1, product_id: 1 },
    options: { unique: true, background: true, name: "uniq_order_prod_purchase" },
  },
  {
    collection: "campaignpurchases",
    index: { campaign_id: 1, user_id: 1 },
    options: { background: true, name: "idx_campaign_user_purchase" },
  },
  {
    collection: "order_items",
    index: { campaign_id: 1 },
    options: { background: true, name: "idx_order_item_campaign" },
  },
];

const run = async () => {
  const isApply = process.argv.includes("--apply");

  console.log("==========================================================");
  console.log("   SCRIPT TẠO INDEX CHO CHIẾN DỊCH GIẢM GIÁ (CAMPAIGNS)   ");
  console.log(`   CHẾ ĐỘ HIỆN TẠI: ${isApply ? "🟢 APPLY (GHI THẬT)" : "🟡 DRY-RUN (MÔ PHỎNG, AN TOÀN)"}`);
  console.log("==========================================================");

  if (!isApply) {
    console.log("\n[DRY-RUN] Danh sách các Index sẽ được tạo:");
    INDEX_DEFINITIONS.forEach((def, i) => {
      console.log(`  ${i + 1}. Collection: [${def.collection}]`);
      console.log(`     Index: ${JSON.stringify(def.index)}`);
      console.log(`     Options: ${JSON.stringify(def.options)}`);
    });
    console.log("\n⚠️ [DRY-RUN] Chưa có bất kỳ thay đổi nào được ghi vào Database.");
    console.log("💡 Để áp dụng thật, chạy: node src/scripts/create-campaign-indexes.js --apply\n");
    process.exit(0);
  }

  // Chế độ Apply
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error("Không tìm thấy biến môi trường MONGO_URI / DATABASE_URL");
    }

    console.log("\n[APPLY] Đang kết nối tới cơ sở dữ liệu MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB thành công.\n");

    const db = mongoose.connection.db;

    for (const def of INDEX_DEFINITIONS) {
      console.log(`⏳ Đang tạo index cho collection "${def.collection}"...`);
      try {
        const col = db.collection(def.collection);
        const result = await col.createIndex(def.index, def.options);
        console.log(`   ✅ Thành công: ${result}`);
      } catch (err) {
        console.error(`   ❌ Lỗi khi tạo index cho "${def.collection}":`, err.message);
      }
    }

    console.log("\n🎉 Hoàn thành quá trình tạo Index.");
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối cơ sở dữ liệu.");
    process.exit(0);
  }
};

run();

