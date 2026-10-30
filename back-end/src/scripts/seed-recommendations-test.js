import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import UserEvent from "../modules/tracking/userEvent.model.js";
import UserInterestProfile from "../modules/recommendations/userInterestProfile.model.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";
import Category from "../modules/categories/category.model.js";
import recommendationService from "../modules/recommendations/recommendation.service.js";

dotenv.config();

const DEMO_ANON_ID = "anon_demo_recommendation_seed";

const seedRecommendationsTest = async () => {
  const isApply = process.argv.includes("--apply");

  console.log("================================================================");
  console.log(" SCRIPT SEED DU LIEU TEST: HANH VI NGUOI DUNG & DE XUAT");
  console.log(` CHE DO: ${isApply ? "APPLY (Ghi truc tiep vao DB)" : "DRY-RUN (Chi mo phong, KHONG sua DB)"}`);
  console.log("================================================================\n");

  try {
    await connectDB();

    // 1. Tim category va san pham mau trong he thong
    const categories = await Category.find({}).limit(3).lean();
    const products = await Product.find({ is_active: true, stock: { $gt: 0 } })
      .limit(10)
      .lean();
    const user = await User.findOne({ status: "active" }).select("_id email fullName").lean();

    if (products.length === 0) {
      console.warn("⚠️ Khong tim thay san pham nao con hang trong DB de tao du lieu test.");
      return;
    }

    const targetCategory = categories[0] || { _id: products[0]?.category_id, name: "Danh muc test" };
    const p1 = products[0];
    const p2 = products[1] || products[0];
    const p3 = products[2] || products[0];

    console.log(`- Tai khoan test: ${user ? `${user.fullName} (${user._id})` : "Khong tim thay user, chi dung Anonymous ID"}`);
    console.log(`- Anonymous ID:   ${DEMO_ANON_ID}`);
    console.log(`- Category tap trung test: ${targetCategory.name} (${targetCategory._id})`);
    console.log(`- Cac san pham tuong tac mau:`);
    console.log(`  + P1: ${p1.name} (_id: ${p1._id}, gia: ${p1.new_price || p1.price})`);
    console.log(`  + P2: ${p2.name} (_id: ${p2._id}, gia: ${p2.new_price || p2.price})`);
    console.log(`  + P3: ${p3.name} (_id: ${p3._id}, gia: ${p3.new_price || p3.price})\n`);

    // Danh sach su kien du kien tao
    const mockEvents = [
      {
        anonymous_id: DEMO_ANON_ID,
        user_id: user ? user._id : null,
        event_type: "view_product",
        product_id: p1._id,
        category_id: p1.category_id,
        meta: { price: p1.new_price || p1.price, source: "seed_test" },
      },
      {
        anonymous_id: DEMO_ANON_ID,
        user_id: user ? user._id : null,
        event_type: "search",
        query: "áo khoác thời trang",
        meta: { source: "seed_test" },
      },
      {
        anonymous_id: DEMO_ANON_ID,
        user_id: user ? user._id : null,
        event_type: "favorite",
        product_id: p2._id,
        category_id: p2.category_id,
        meta: { price: p2.new_price || p2.price, source: "seed_test" },
      },
      {
        anonymous_id: DEMO_ANON_ID,
        user_id: user ? user._id : null,
        event_type: "add_to_cart",
        product_id: p1._id,
        category_id: p1.category_id,
        meta: { price: p1.new_price || p1.price, quantity: 1, source: "seed_test" },
      },
    ];

    // Profile so thich du kien cap nhat
    const categoryScores = new Map([[targetCategory._id.toString(), 8.0]]);
    const keywordScores = new Map([
      ["áo", 2.0],
      ["khoác", 2.0],
      ["thời", 1.0],
      ["trang", 1.0],
    ]);
    const mockProfile = {
      anonymous_id: DEMO_ANON_ID,
      user_id: user ? user._id : null,
      category_scores: categoryScores,
      keyword_scores: keywordScores,
      price_range: { min: p1.new_price || 100000, max: p2.new_price || 500000 },
      recent_product_ids: [p1._id, p2._id],
      updatedAt: new Date(),
    };

    if (!isApply) {
      console.log("----------------------------------------------------------------");
      console.log("[DRY-RUN] Du lieu du kien se ghi vao DB:");
      console.log("----------------------------------------------------------------");
      console.log(`1. Ghi ${mockEvents.length} ban ghi vao 'user_events':`);
      mockEvents.forEach((ev, idx) => {
        console.log(`   [${idx + 1}] Event: ${ev.event_type} | Product: ${ev.product_id || "null"} | Query: ${ev.query || "null"}`);
      });

      console.log(`\n2. Ghi profile vao 'user_interest_profiles':`);
      console.log(`   - Category scores:`, Object.fromEntries(categoryScores));
      console.log(`   - Keyword scores: `, Object.fromEntries(keywordScores));
      console.log(`   - Price range:    `, mockProfile.price_range);
      console.log(`   - Recent products:`, mockProfile.recent_product_ids);

      console.log("\n3. Chay mo phong tinh toan de xuat thu nghiem:");
      const previewRecs = await recommendationService.getRecommendations({
        anonymousId: DEMO_ANON_ID,
        userId: user?._id?.toString(),
        limit: 5,
      });

      console.log(`=> Ket qua de xuat thu nghiem (${previewRecs.length} san pham):`);
      previewRecs.forEach((prod, i) => {
        console.log(`   ${i + 1}. [${prod._id}] ${prod.name} - Gia: ${prod.new_price || prod.price}đ - Rating: ${prod.rating || 0}`);
      });

      console.log("\nDe thuc su ghi du lieu test vao database, hay chay lenh:");
      console.log("  node src/scripts/seed-recommendations-test.js --apply\n");
    } else {
      console.log("[APPLY] Dang ghi du lieu test vao database...");

      // Ghi events
      await UserEvent.insertMany(mockEvents);
      console.log(`✅ Da ghi ${mockEvents.length} su kien vao collection 'user_events'.`);

      // Ghi profile
      const profileFilter = user ? { user_id: user._id } : { anonymous_id: DEMO_ANON_ID };
      await UserInterestProfile.findOneAndUpdate(
        profileFilter,
        {
          $set: mockProfile,
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Da tao/cap nhat ban ghi trong 'user_interest_profiles'.`);

      // Thu nghiem goi de xuat truc tiep
      console.log("\n[KIEM TRA DE XUAT THUC TE]");
      const recs = await recommendationService.getRecommendations({
        anonymousId: DEMO_ANON_ID,
        userId: user?._id?.toString(),
        limit: 5,
      });

      console.log(`=> Danh sach de xuat thuc te (${recs.length} san pham):`);
      recs.forEach((prod, i) => {
        console.log(`   ${i + 1}. [${prod._id}] ${prod.name} - Gia: ${prod.new_price || prod.price}đ`);
      });
      console.log("\n=> [HOAN TAT] Seed test thanh cong!\n");
    }
  } catch (error) {
    console.error("Loi khi seed du lieu test:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Da dong ket noi MongoDB.");
  }
};

seedRecommendationsTest();
