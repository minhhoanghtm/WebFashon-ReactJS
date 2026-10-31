import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import Category from "../modules/categories/category.model.js";
import Product, { ProductVariant } from "../modules/products/product.model.js";
import Page from "../modules/pages/page.model.js";
import PageSection from "../modules/pageSections/pageSection.model.js";
import Voucher from "../modules/vouchers/voucher.model.js";
import WebsiteSettings from "../modules/websiteSettings/websiteSettings.model.js";
import Experiment from "../modules/recommendations/experiments/experiment.model.js";
import User from "../modules/users/user.model.js";
import vectorIndexService from "../modules/ai/services/vectorIndex.service.js";
import { AA_EXPERIMENT_ID } from "../modules/recommendations/experiments/experiment.service.js";

const STAGING_URI = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";

async function seedStaging() {
  console.log("=== SEEDING ISOLATED STAGING DATABASE ===");
  console.log(`Connecting to: ${STAGING_URI}`);
  await mongoose.connect(STAGING_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log(" Connected to Staging MongoDB successfully.");

  // 0. Seed Users (Admin & Customer)
  const hashedCustomerPassword = await bcrypt.hash("StagingPass123!", 10);
  await User.findOneAndUpdate(
    { email: "customer@404studio.vn" },
    {
      $set: {
        fullName: "Khách Hàng Staging",
        passWord: hashedCustomerPassword,
        role: "user",
        status: "active",
        consent_status: "granted",
        addresses: [
          {
            fullName: "Khách Hàng Staging",
            phone: "0987654321",
            provinceCode: "01",
            districtCode: "001",
            wardCode: "00001",
            addressDetail: "123 Phố Huế, Hoàn Kiếm, Hà Nội",
            isDefault: true,
          },
        ],
      },
    },
    { upsert: true, new: true }
  );
  console.log("  + Seeded test customer user: customer@404studio.vn / StagingPass123!");

  const hashedAdminPassword = await bcrypt.hash("StagingAdmin123!", 10);
  await User.findOneAndUpdate(
    { email: "admin@404studio.vn" },
    {
      $set: {
        fullName: "Admin Staging",
        passWord: hashedAdminPassword,
        role: "admin",
        status: "active",
        consent_status: "granted",
      },
    },
    { upsert: true, new: true }
  );
  console.log("  + Seeded test admin user: admin@404studio.vn / StagingAdmin123!");

  // 1. Seed Categories
  const existingCat = await Category.findOne({ slug: "ao-nam" });
  let catAoNam = existingCat;
  if (!catAoNam) {
    catAoNam = await Category.create({
      name: "Áo Nam",
      slug: "ao-nam",
      description: "Các mẫu áo thun, áo sơ mi, áo khoác nam thời trang cao cấp",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
      order: 1,
    });
  }

  const existingCatQuan = await Category.findOne({ slug: "quan-nam" });
  let catQuan = existingCatQuan;
  if (!catQuan) {
    catQuan = await Category.create({
      name: "Quần Nam",
      slug: "quan-nam",
      description: "Quần jean, quần tây, quần short nam chất liệu thoáng mát",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
      order: 2,
    });
  }

  // 2. Seed Products & Variants
  const sampleProducts = [
    {
      name: "Áo Thun Trơn Oversize Nam",
      slug: "ao-thun-tron-oversize-nam-staging",
      category_id: catAoNam._id,
      new_price: 189000,
      old_price: 250000,
      stock: 50,
      description: "Áo thun form rộng oversize phong cách streetwear trẻ trung. Chất liệu 100% cotton thoáng mát, thấm hút mồ hôi tốt.",
      displayProduct: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
      is_active: true,
      variants: [
        { color: "Đen", size: "L", stock: 25, price: 189000, image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" },
        { color: "Trắng", size: "L", stock: 15, price: 189000, image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" },
        { color: "Đen", size: "M", stock: 10, price: 189000, image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" },
      ],
    },
    {
      name: "Áo Hoodie Nỉ Bông Unisex",
      slug: "ao-hoodie-ni-bong-unisex-staging",
      category_id: catAoNam._id,
      new_price: 429000,
      old_price: 550000,
      stock: 30,
      description: "Áo khoác hoodie nỉ bông ấm áp, phù hợp mặc mùa đông, cản gió giữ nhiệt tốt.",
      displayProduct: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80"],
      is_active: true,
      variants: [
        { color: "Xám", size: "XL", stock: 15, price: 429000, image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80" },
        { color: "Đen", size: "L", stock: 15, price: 429000, image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80" },
      ],
    },
    {
      name: "Quần Jeans Slim Fit Nam Xanh Indigo",
      slug: "quan-jeans-slim-fit-nam-staging",
      category_id: catQuan._id,
      new_price: 469000,
      old_price: 600000,
      stock: 40,
      description: "Quần bò nam kiểu dáng slim fit co giãn nhẹ, mặc đi chơi hoặc đi làm đều đẹp và lịch sự.",
      displayProduct: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"],
      is_active: true,
      variants: [
        { color: "Xanh Indigo", size: "31", stock: 20, price: 469000, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80" },
        { color: "Xanh Đậm", size: "32", stock: 20, price: 469000, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80" },
      ],
    },
    {
      name: "Quần Short Kaki Nam Đi Biển",
      slug: "quan-short-kaki-nam-staging",
      category_id: catQuan._id,
      new_price: 249000,
      old_price: 320000,
      stock: 35,
      description: "Quần đùi short kaki thoáng mát, thời trang mùa hè và trang phục đi biển thoải mái.",
      displayProduct: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80"],
      is_active: true,
      variants: [
        { color: "Be", size: "L", stock: 20, price: 249000, image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80" },
        { color: "Đen", size: "M", stock: 15, price: 249000, image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80" },
      ],
    },
  ];

  await Product.deleteMany({ slug: { $in: sampleProducts.map((s) => s.slug) } });

  for (const item of sampleProducts) {
    let p = await Product.findOne({ slug: item.slug });
    if (!p) {
      p = await Product.create({
        name: item.name,
        slug: item.slug,
        category_id: item.category_id,
        new_price: item.new_price,
        old_price: item.old_price,
        stock: item.stock,
        description: item.description,
        displayProduct: item.displayProduct,
        is_active: item.is_active,
      });
      for (const v of item.variants) {
        await ProductVariant.create({
          product_id: p._id,
          color: v.color,
          size: v.size,
          stock: v.stock,
          price: v.price,
          image_url: v.image_url,
        });
      }
      console.log(`  + Seeded product: ${p.name}`);
    }
  }

  // 3. Seed Policy Page
  await Page.deleteOne({ slug: "policy" });
  let policyPage = await Page.findOne({ slug: "policy" });
  if (!policyPage) {
    policyPage = await Page.create({
      title: "Chính sách đổi trả & bảo hành 404Studio",
      slug: "policy",
      type: "policy",
      status: "published",
    });
    await PageSection.create({
      pageId: policyPage._id,
      type: "story",
      order: 1,
      isActive: true,
      data: {
        title: "Quy định đổi hàng",
        content: "Khách hàng được hỗ trợ đổi size hoặc đổi sản phẩm lỗi trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên nhãn mác tag giá và chưa qua giặt ủi.",
      },
    });
    console.log("  + Seeded Policy page");
  }

  // 4. Seed Website Settings
  await WebsiteSettings.findOneAndUpdate(
    { singletonKey: "default" },
    {
      $set: {
        general: {
          siteName: "404Studio Staging",
          siteDescription: "Môi trường Staging kiểm thử Vector AI",
          address: "Số 123 Đường Thời Trang, Hà Nội",
          hotline: "1900-404-000",
          email: "staging@404studio.vn",
          workingHours: "08:30 - 21:30 hàng ngày",
        },
      },
    },
    { upsert: true }
  );
  console.log("  + Seeded Website Settings");

  // 5. Seed A/A Validation Experiment in Staging (status: 'running')
  await Experiment.findOneAndUpdate(
    { experiment_id: AA_EXPERIMENT_ID },
    {
      $set: {
        name: "A/A Testing: Baseline Recommendation Validation (Staging)",
        description: "Kiểm định A/A phân bổ lưu lượng 50/50 trên Staging, cả hai biến thể đều chạy control_popular.",
        status: "running",
        variants: [
          {
            name: "A",
            weight: 50,
            description: "Control Group A: Thuật toán truyền thống (Bán chạy, Mới về, Nổi bật)",
            algorithm: "control_popular",
          },
          {
            name: "B",
            weight: 50,
            description: "Control Group B: Thuật toán truyền thống (Bán chạy, Mới về, Nổi bật)",
            algorithm: "control_popular",
          },
        ],
        salt: "wf_aa_validation_salt_2026",
        target_metric: "purchase_conversion_rate",
        attribution_window_hours: 24,
        traffic_allocation: 100,
        start_time: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  console.log(`  + Seeded and Activated Experiment: ${AA_EXPERIMENT_ID} (status: running)`);

  // 6. Synchronize Vector Embeddings for Staging entities
  console.log("=== SYNCHRONIZING STAGING VECTOR EMBEDDINGS ===");
  const syncSummary = await vectorIndexService.syncAll({
    types: ["product", "page", "settings"],
    force: true,
    allowLocalFallback: false,
  });
  console.log("Staging Vector Sync Summary:", JSON.stringify(syncSummary, null, 2));

  await mongoose.disconnect();
  console.log("=== STAGING DATABASE SEEDING COMPLETED ===");
  process.exit(0);
}

seedStaging().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
