import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import User from "../modules/users/user.model.js";
import Category from "../modules/categories/category.model.js";
import Product, { ProductVariant } from "../modules/products/product.model.js";
import Banner from "../modules/banners/banner.model.js";
import Page from "../modules/pages/page.model.js";
import PageSection from "../modules/pageSections/pageSection.model.js";
import Voucher from "../modules/vouchers/voucher.model.js";
import Campaign from "../modules/campaigns/campaign.model.js";
import WebsiteSettings from "../modules/websiteSettings/websiteSettings.model.js";
import { Order, OrderItem } from "../modules/orders/order.model.js";
import Review from "../modules/reviews/review.model.js";
import Conversation from "../modules/conversations/conversation.model.js";
import Message from "../modules/messages/message.model.js";

const LOCAL_DEV_MONGO_URI = process.env.LOCAL_DEV_MONGO_URI || "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";

// Safety check for connection target
function verifySafeTarget(uri) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ABORT: Seed script cannot run when NODE_ENV is production!");
  }
  const isCloudOrProd = /mongodb\.net|cluster|prod|live/i.test(uri);
  const isLocal = /localhost|127\.0\.0\.1|27017|27018/i.test(uri);
  if (isCloudOrProd && !isLocal) {
    throw new Error("ABORT: Connection string looks like a shared cloud or production database! Seed aborted.");
  }
}

export async function runCompleteSeed() {
  console.log("=== BẮT ĐẦU SEED DỮ LIỆU DEV TOÀN DIỆN (IDEMPOTENT) ===");
  verifySafeTarget(LOCAL_DEV_MONGO_URI);
  console.log(" Kết nối DB an toàn:", LOCAL_DEV_MONGO_URI.replace(/:[^:]*@/, ":***@"));

  await mongoose.connect(LOCAL_DEV_MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(" Đã kết nối MongoDB thành công.");

  // -------------------------------------------------------------------------
  // 1. TÀI KHOẢN (Admin, Staff, Customer)
  // -------------------------------------------------------------------------
  console.log("\n[1/10] Seed tài khoản...");
  const adminHash = await bcrypt.hash("DevAdmin2026!", 10);
  const adminUser = await User.findOneAndUpdate(
    { email: "admin@404studio.vn" },
    {
      $set: {
        fullName: "Quản Trị Viên Atelier",
        passWord: adminHash,
        role: "admin",
        status: "active",
        avatar_url: "/uploads/default-avatar.svg",
        consent_status: "granted",
        addresses: [
          {
            fullName: "Quản Trị Viên Atelier",
            phone: "0900000001",
            provinceCode: "79",
            districtCode: "760",
            wardCode: "26734",
            addressDetail: "Showroom: 88 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      },
    },
    { upsert: true, new: true }
  );

  const staffHash = await bcrypt.hash("DevStaff2026!", 10);
  const staffUser = await User.findOneAndUpdate(
    { email: "staff@404studio.vn" },
    {
      $set: {
        fullName: "Nhân Viên CSKH Atelier",
        passWord: staffHash,
        role: "admin",
        status: "active",
        avatar_url: "/uploads/default-avatar.svg",
        consent_status: "granted",
      },
    },
    { upsert: true, new: true }
  );

  const customerHash = await bcrypt.hash("DevCustomer2026!", 10);
  const customerUser = await User.findOneAndUpdate(
    { email: "customer@404studio.vn" },
    {
      $set: {
        fullName: "Khách Hàng Thân Thiết",
        passWord: customerHash,
        role: "user",
        status: "active",
        avatar_url: "/uploads/default-avatar.svg",
        consent_status: "granted",
        addresses: [
          {
            fullName: "Khách Hàng Thân Thiết",
            phone: "0987654321",
            provinceCode: "01",
            districtCode: "001",
            wardCode: "00001",
            addressDetail: "123 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội",
            isDefault: true,
          },
        ],
      },
    },
    { upsert: true, new: true }
  );
  console.log("  ✓ Đã seed Admin, Staff, Customer");

  // -------------------------------------------------------------------------
  // 2. DANH MỤC (Category hierarchy)
  // -------------------------------------------------------------------------
  console.log("\n[2/10] Seed danh mục cha-con...");
  const categoriesData = [
    {
      name: "Thời Trang Nam",
      slug: "thoi-trang-nam",
      description: "Bộ sưu tập may đo nam đương đại phom dáng kiến trúc.",
      image: "/uploads/hero-atelier.webp",
      order: 1,
      parent_id: null,
    },
    {
      name: "Thời Trang Nữ",
      slug: "thoi-trang-nu",
      description: "Tuyển tập thiết kế may đo cao cấp cho nữ giới.",
      image: "/uploads/lookbook-evening.webp",
      order: 2,
      parent_id: null,
    },
    {
      name: "Phụ Kiện Đơn Sắc",
      slug: "phu-kien-don-sac",
      description: "Túi da thủ công và phụ kiện thời trang tối giản.",
      image: "/uploads/product-brown-bag.webp",
      order: 3,
      parent_id: null,
    },
  ];

  const catMap = {};
  for (const c of categoriesData) {
    const saved = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: c },
      { upsert: true, new: true }
    );
    catMap[c.slug] = saved._id;
  }

  // Danh mục con
  const subCategories = [
    {
      name: "Áo Sơ Mi Nam",
      slug: "ao-so-mi-nam",
      description: "Sơ mi poplin may đo chuẩn mực",
      image: "/uploads/product-linen-shirt.jpg",
      order: 1,
      parent_id: catMap["thoi-trang-nam"],
    },
    {
      name: "Áo Blazer May Đo",
      slug: "ao-blazer-may-do",
      description: "Blazer cấu trúc phom dáng kiến trúc đương đại",
      image: "/uploads/product-navy-blazer.webp",
      order: 2,
      parent_id: catMap["thoi-trang-nam"],
    },
    {
      name: "Quần Tây Ống Đứng",
      slug: "quan-tay-ong-dung",
      description: "Quần tây phom đứng len dệt cao cấp",
      image: "/uploads/lookbook-summer.webp",
      order: 3,
      parent_id: catMap["thoi-trang-nam"],
    },
    {
      name: "Váy May Đo Cấu Trúc",
      slug: "vay-may-do-cau-truc",
      description: "Váy đơn sắc phom suông tối giản",
      image: "/uploads/lookbook-evening.webp",
      order: 1,
      parent_id: catMap["thoi-trang-nu"],
    },
    {
      name: "Túi Da Tối Giản",
      slug: "tui-da-toi-gian",
      description: "Túi xách da thuộc thủ công cao cấp",
      image: "/uploads/product-brown-bag.webp",
      order: 1,
      parent_id: catMap["phu-kien-don-sac"],
    },
  ];

  for (const sc of subCategories) {
    const saved = await Category.findOneAndUpdate(
      { slug: sc.slug },
      { $set: sc },
      { upsert: true, new: true }
    );
    catMap[sc.slug] = saved._id;
  }
  console.log("  ✓ Đã seed danh mục cha-con");

  // -------------------------------------------------------------------------
  // 3. SẢN PHẨM & BIẾN THỂ (Products & Variants)
  // -------------------------------------------------------------------------
  console.log("\n[3/10] Seed sản phẩm & biến thể...");
  const productsSeed = [
    {
      name: "Áo Blazer Len Dệt Cấu Trúc Navy",
      slug: "ao-blazer-len-det-cau-truc-navy",
      category_id: catMap["ao-blazer-may-do"] || catMap["thoi-trang-nam"],
      new_price: 1850000,
      old_price: 2200000,
      stock: 45,
      description: "Áo khoác blazer may đo thủ công từ chất liệu len dệt pha lụa tự nhiên. Phom dáng hình học tối giản, vai đệm nhẹ tôn vinh tỷ lệ hình thể hiện đại.",
      displayProduct: ["/uploads/product-navy-blazer.webp", "/uploads/hero-atelier.webp"],
      is_active: true,
      variants: [
        { color: "Xanh Navy", size: "M", stock: 15, price: 1850000, image_url: "/uploads/product-navy-blazer.webp" },
        { color: "Xanh Navy", size: "L", stock: 20, price: 1850000, image_url: "/uploads/product-navy-blazer.webp" },
        { color: "Đen Tuyền", size: "L", stock: 10, price: 1850000, image_url: "/uploads/product-navy-blazer.webp" },
      ],
    },
    {
      name: "Áo Sơ Mi Poplin Cotton Trắng Khối Hộp",
      slug: "ao-so-mi-poplin-cotton-trang-khoi-hop",
      category_id: catMap["ao-so-mi-nam"] || catMap["thoi-trang-nam"],
      new_price: 790000,
      old_price: 950000,
      stock: 60,
      description: "Áo sơ mi dáng rộng khối hộp chế tác từ cotton poplin 100% nhập khẩu. Cổ áo ve nhọn tinh tế, đường chỉ đôi viền may chuẩn xác.",
      displayProduct: ["/uploads/product-linen-shirt.jpg", "/uploads/hero-atelier.webp"],
      is_active: true,
      variants: [
        { color: "Trắng Nguyên Bản", size: "M", stock: 25, price: 790000, image_url: "/uploads/product-linen-shirt.jpg" },
        { color: "Trắng Nguyên Bản", size: "L", stock: 25, price: 790000, image_url: "/uploads/product-linen-shirt.jpg" },
        { color: "Xám Nhạt", size: "L", stock: 10, price: 790000, image_url: "/uploads/product-linen-shirt.jpg" },
      ],
    },
    {
      name: "Quần Tây Ống Đứng Len Pha Xám Than",
      slug: "quan-tay-ong-dung-len-pha-xam-than",
      category_id: catMap["quan-tay-ong-dung"] || catMap["thoi-trang-nam"],
      new_price: 1150000,
      old_price: 1400000,
      stock: 40,
      description: "Quần tây may đo phom đứng thanh thoát, cạp cao tôn dáng. Vải len dệt xước chống nhăn tự nhiên, hoàn thiện với khuy cài ẩn sang trọng.",
      displayProduct: ["/uploads/lookbook-summer.webp"],
      is_active: true,
      variants: [
        { color: "Xám Than", size: "30", stock: 15, price: 1150000, image_url: "/uploads/lookbook-summer.webp" },
        { color: "Xám Than", size: "31", stock: 15, price: 1150000, image_url: "/uploads/lookbook-summer.webp" },
        { color: "Đen Tuyền", size: "32", stock: 10, price: 1150000, image_url: "/uploads/lookbook-summer.webp" },
      ],
    },
    {
      name: "Túi Xách Da Thuộc Thô Atelier Brown",
      slug: "tui-xach-da-thuoc-tho-atelier-brown",
      category_id: catMap["tui-da-toi-gian"] || catMap["phu-kien-don-sac"],
      new_price: 2450000,
      old_price: 2900000,
      stock: 20,
      description: "Túi xách da bò thuộc thảo mộc nguyên tấm, giữ trọn những vân da tự nhiên độc bản. Khóa đồng thau đánh mờ, quai đeo tăng chỉnh linh hoạt.",
      displayProduct: ["/uploads/product-brown-bag.webp"],
      is_active: true,
      variants: [
        { color: "Nâu Đất", size: "Tiêu Chuẩn", stock: 12, price: 2450000, image_url: "/uploads/product-brown-bag.webp" },
        { color: "Đen Mờ", size: "Tiêu Chuẩn", stock: 8, price: 2450000, image_url: "/uploads/product-brown-bag.webp" },
      ],
    },
    {
      name: "Váy Đơn Sắc Cắt Lưng Tinh Giản",
      slug: "vay-don-sac-cat-lung-tinh-gian",
      category_id: catMap["vay-may-do-cau-truc"] || catMap["thoi-trang-nu"],
      new_price: 1650000,
      old_price: 1950000,
      stock: 30,
      description: "Váy suông đơn sắc đương đại với điểm nhấn cut-out tinh tế sau lưng. Chất liệu lụa satin mờ mềm rủ, mang lại vẻ đẹp thanh lịch vượt thời gian.",
      displayProduct: ["/uploads/lookbook-evening.webp"],
      is_active: true,
      variants: [
        { color: "Đen Tuyền", size: "S", stock: 10, price: 1650000, image_url: "/uploads/lookbook-evening.webp" },
        { color: "Đen Tuyền", size: "M", stock: 15, price: 1650000, image_url: "/uploads/lookbook-evening.webp" },
        { color: "Trắng Ngà", size: "M", stock: 5, price: 1650000, image_url: "/uploads/lookbook-evening.webp" },
      ],
    },
    {
      name: "Giày Sneaker Da Minimalist White",
      slug: "giay-sneaker-da-minimalist-white",
      category_id: catMap["phu-kien-don-sac"],
      new_price: 1350000,
      old_price: 1600000,
      stock: 35,
      description: "Sneaker da nappa trắng trơn tối giản, đế cao su đúc nguyên khối êm ái. Phù hợp phối đồ từ âu phục may đo đến trang phục thường nhật.",
      displayProduct: ["/uploads/product-white-sneakers.jpg"],
      is_active: true,
      variants: [
        { color: "Trắng", size: "40", stock: 10, price: 1350000, image_url: "/uploads/product-white-sneakers.jpg" },
        { color: "Trắng", size: "41", stock: 15, price: 1350000, image_url: "/uploads/product-white-sneakers.jpg" },
        { color: "Trắng", size: "42", stock: 10, price: 1350000, image_url: "/uploads/product-white-sneakers.jpg" },
      ],
    },
  ];

  const seededProducts = [];
  for (const p of productsSeed) {
    const savedProd = await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          category_id: p.category_id,
          new_price: p.new_price,
          old_price: p.old_price,
          stock: p.stock,
          description: p.description,
          displayProduct: p.displayProduct,
          is_active: p.is_active,
        },
      },
      { upsert: true, new: true }
    );
    seededProducts.push(savedProd);

    // Seed variants for this product
    await ProductVariant.deleteMany({ product_id: savedProd._id });
    for (const v of p.variants) {
      await ProductVariant.create({
        product_id: savedProd._id,
        color: v.color,
        size: v.size,
        stock: v.stock,
        price: v.price,
        image_url: v.image_url,
      });
    }
  }
  console.log(`  ✓ Đã seed ${seededProducts.length} sản phẩm kèm đầy đủ biến thể`);

  // -------------------------------------------------------------------------
  // 4. BANNERS
  // -------------------------------------------------------------------------
  console.log("\n[4/10] Seed banners...");
  const bannersData = [
    {
      title: "BỘ SƯU TẬP CHỦ ĐẠO · ATELIER EDITION",
      position: "home_hero",
      image: "/uploads/hero-atelier.webp",
      link: "/products",
      status: "active",
      order: 1,
      description: "Cấu trúc tối giản, bản sắc đương đại tôn vinh may đo thủ công.",
    },
    {
      title: "LOOKBOOK HẠ 2026 · PHOM DÁNG TỰ DO",
      position: "home_slider",
      image: "/uploads/lookbook-summer.webp",
      link: "/lookbooks",
      status: "active",
      order: 2,
      description: "Đường nét thanh thoát qua lăng kính điện ảnh đương đại.",
    },
    {
      title: "ĐẶC QUYỀN THÀNH VIÊN ATELIER",
      position: "home_promotion",
      image: "/uploads/lookbook-evening.webp",
      link: "/vouchers",
      status: "active",
      order: 3,
      description: "Nhận ưu đãi độc quyền cho các thiết kế ấn bản giới hạn.",
    },
  ];

  for (const b of bannersData) {
    await Banner.findOneAndUpdate(
      { position: b.position },
      { $set: b },
      { upsert: true }
    );
  }
  console.log("  ✓ Đã seed banners cho các vị trí trang chủ");

  // -------------------------------------------------------------------------
  // 5. LOOKBOOKS & CMS PAGES
  // -------------------------------------------------------------------------
  console.log("\n[5/10] Seed lookbooks & CMS pages...");
  const pagesData = [
    {
      title: "Ấn Bản Mùa Hạ: Bản Sắc Đơn Sắc",
      slug: "lookbook-summer-2026",
      type: "lookbook",
      status: "published",
      displayOrder: 1,
      publishedAt: new Date(),
      excerpt: "Sự đối thoại giữa phom dáng tối giản và không gian kiến trúc nhiệt đới.",
      thumbnailUrl: "/uploads/lookbook-summer.webp",
      bannerUrl: "/uploads/lookbook-summer.webp",
      isFeatured: true,
    },
    {
      title: "Dạ Tiệc Tối Giản: Cấu Trúc Ánh Sáng",
      slug: "lookbook-evening-2026",
      type: "lookbook",
      status: "published",
      displayOrder: 2,
      publishedAt: new Date(),
      excerpt: "Tuyển tập thiết kế may đo cao cấp ghi hình trong không gian bóng tối và ánh sáng tương phản.",
      thumbnailUrl: "/uploads/lookbook-evening.webp",
      bannerUrl: "/uploads/lookbook-evening.webp",
      isFeatured: false,
    },
    {
      title: "Câu chuyện thương hiệu 404 STUDIO",
      slug: "about",
      type: "about",
      status: "published",
      displayOrder: 3,
      publishedAt: new Date(),
      excerpt: "Triết lý may đo đơn sắc, tính chính xác của đường cắt và sứ mệnh tôn vinh sự tinh tế nguyên bản.",
      thumbnailUrl: "/uploads/hero-atelier.webp",
      bannerUrl: "/uploads/hero-atelier.webp",
    },
    {
      title: "Chính sách đổi trả & bảo hành",
      slug: "policy",
      type: "policy",
      status: "published",
      displayOrder: 4,
      publishedAt: new Date(),
      excerpt: "Quy định đổi trả hàng trong 7 ngày, bảo hành đường may trọn đời và vận chuyển miễn phí toàn quốc.",
    },
    {
      title: "Câu hỏi thường gặp (FAQ)",
      slug: "faq",
      type: "faq",
      status: "published",
      displayOrder: 5,
      publishedAt: new Date(),
      excerpt: "Giải đáp chi tiết về chọn size, bảo quản vải tự nhiên, thanh toán và theo dõi vận chuyển.",
    },
  ];

  for (const pg of pagesData) {
    const saved = await Page.findOneAndUpdate(
      { slug: pg.slug },
      { $set: pg },
      { upsert: true, new: true }
    );

    // Seed sections for lookbook
    if (pg.type === "lookbook") {
      await PageSection.deleteMany({ pageId: saved._id });
      await PageSection.create({
        pageId: saved._id,
        type: "hero",
        order: 1,
        isActive: true,
        data: {
          title: pg.title,
          subtitle: pg.excerpt,
          coverImage: pg.thumbnailUrl,
        },
      });
      await PageSection.create({
        pageId: saved._id,
        type: "quote",
        order: 2,
        isActive: true,
        data: {
          quote: "Đơn sắc không phải là sự thiếu vắng màu sắc, mà là sự cô đọng cao nhất của tinh thần.",
          author: "Giám đốc Sáng tạo 404 STUDIO",
        },
      });
    }
  }
  console.log("  ✓ Đã seed Lookbooks và CMS Pages");

  // -------------------------------------------------------------------------
  // 6. VOUCHERS (Valid, Expired, Out of limit)
  // -------------------------------------------------------------------------
  console.log("\n[6/10] Seed vouchers...");
  const vouchersData = [
    {
      code: "ATELIER10",
      description: "Giảm 10% tối đa 200.000đ cho đơn từ 500.000đ",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 500000,
      maxDiscount: 200000,
      usageLimit: 100,
      usedCount: 5,
      startDate: new Date(Date.now() - 7 * 86400000),
      endDate: new Date(Date.now() + 60 * 86400000),
      isActive: true,
    },
    {
      code: "WELCOME50K",
      description: "Giảm trực tiếp 50.000đ cho khách hàng mới",
      discountType: "fixed",
      discountValue: 50000,
      minOrderValue: 300000,
      maxDiscount: 50000,
      usageLimit: 200,
      usedCount: 12,
      startDate: new Date(Date.now() - 7 * 86400000),
      endDate: new Date(Date.now() + 30 * 86400000),
      isActive: true,
    },
    {
      code: "EXPIRED2025",
      description: "Mã ưu đãi đã hết hạn (dùng kiểm thử báo lỗi hết hạn)",
      discountType: "fixed",
      discountValue: 100000,
      minOrderValue: 200000,
      maxDiscount: 100000,
      usageLimit: 50,
      usedCount: 10,
      startDate: new Date(Date.now() - 90 * 86400000),
      endDate: new Date(Date.now() - 10 * 86400000),
      isActive: true,
    },
    {
      code: "SOLDOUT100",
      description: "Mã ưu đãi đã hết lượt dùng (dùng kiểm thử báo lỗi hết lượt)",
      discountType: "fixed",
      discountValue: 100000,
      minOrderValue: 200000,
      maxDiscount: 100000,
      usageLimit: 10,
      usedCount: 10,
      startDate: new Date(Date.now() - 5 * 86400000),
      endDate: new Date(Date.now() + 30 * 86400000),
      isActive: true,
    },
  ];

  for (const v of vouchersData) {
    await Voucher.findOneAndUpdate(
      { code: v.code },
      { $set: v },
      { upsert: true }
    );
  }
  console.log("  ✓ Đã seed các loại Voucher (còn hạn, hết hạn, hết lượt)");

  // -------------------------------------------------------------------------
  // 7. FLASH SALE CAMPAIGN
  // -------------------------------------------------------------------------
  console.log("\n[7/10] Seed chiến dịch Flash Sale...");
  await Campaign.findOneAndUpdate(
    { slug: "mid-season-atelier-flash-sale" },
    {
      $set: {
        name: "Mid-Season Atelier Flash Sale",
        slug: "mid-season-atelier-flash-sale",
        description: "Ưu đãi độc quyền các thiết kế áo may đo giới hạn",
        startAt: new Date(Date.now() - 2 * 86400000),
        endAt: new Date(Date.now() + 5 * 86400000),
        status: "active",
        type: "flash_sale",
      },
    },
    { upsert: true }
  );
  console.log("  ✓ Đã seed chiến dịch Flash Sale");

  // -------------------------------------------------------------------------
  // 8. CÀI ĐẶT WEBSITE (WebsiteSettings với homeContent)
  // -------------------------------------------------------------------------
  console.log("\n[8/10] Seed cài đặt website & nội dung trang chủ...");
  await WebsiteSettings.findOneAndUpdate(
    { singletonKey: "default" },
    {
      $set: {
        general: {
          siteName: "404 STUDIO",
          siteDescription: "Thương hiệu thời trang may đo độc bản hướng tới cấu trúc thuần khiết, chất liệu cao cấp và sự tự do biểu cảm.",
          logoUrl: "/uploads/logo.png",
          faviconUrl: "/favicon.svg",
          hotline: "1900 404 000",
          email: "atelier@404studio.vn",
          address: "Showroom: 88 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          workingHours: "09:00 - 21:30 hàng ngày",
        },
        seo: {
          metaTitle: "404 STUDIO — Atelier Edition | Thời Trang Tối Giản Đơn Sắc",
          metaDescription: "Khám phá các thiết kế may đo đương đại, đường cắt chuẩn xác và tinh thần đơn sắc độc bản tại 404 STUDIO.",
          metaKeywords: "thời trang tối giản, may đo thủ công, 404 studio, atelier edition, monochrome",
          ogImage: "/uploads/hero-atelier.webp",
        },
        system: {
          maintenanceMode: false,
          allowGuestCheckout: true,
          enableVoucher: true,
          enableReviews: true,
        },
        socialLinks: {
          facebook: "https://facebook.com/404studio.atelier",
          instagram: "https://instagram.com/404studio.atelier",
          tiktok: "https://tiktok.com/@404studio.atelier",
          youtube: "https://youtube.com/@404studio.atelier",
          zalo: "https://zalo.me/0900000001",
        },
        footer: {
          companyName: "CÔNG TY CỔ PHẦN THỜI TRANG 404 STUDIO",
          taxCode: "0317894562",
          copyrightText: "© 2026 404 STUDIO ATELIER. BẢN QUYỀN ĐƯỢC BẢO HỘ.",
        },
        homeContent: {
          hero: {
            eyebrow: "BỘ SƯU TẬP CHỦ ĐẠO · ATELIER EDITION",
            titleLine1: "CẤU TRÚC TỐI GIẢN.",
            titleLine2: "BẢN SẮC ĐƯƠNG ĐẠI.",
            subtitle: "Tôn vinh nghệ thuật may đo thủ công kết hợp kỹ nghệ xử lý phom dáng kiến trúc đương đại.",
            cta: "KHÁM PHÁ BỘ SƯU TẬP",
            scrollHint: "CUỘN ĐỂ KHÁM PHÁ",
          },
          brandChapter: {
            eyebrow: "CHƯƠNG 01 · TRIẾT LÝ THIẾT KẾ",
            headingLines: ["NGHỆ THUẬT", "MAY ĐO", "KIẾN TRÚC."],
            description: "Mỗi đường cắt là một tuyên ngôn về sự chuẩn xác. Chúng tôi từ chối những chi tiết rườm rà để giải phóng cấu trúc nguyên bản — nơi chất liệu tự nhiên và đường may đơn sắc tôn vinh tỷ lệ hình thể đương đại.",
            cta: "XEM TẤT CẢ THIẾT KẾ",
          },
          manifesto: {
            eyebrow: "ATELIER MANIFESTO · TUYÊN NGÔN BẢN SẮC",
            words: ["TRONG", "THẾ GIỚI", "CỦA", "SỰ PHỒN TẠP,", "CẤU TRÚC", "ĐƠN SẮC", "CHÍNH LÀ", "ĐỈNH CAO", "CỦA", "TỰ DO", "BIỂU CẢM."],
            description: "Được chế tác với niềm tin rằng sự xa xỉ thực thụ nằm ở những khoảng lặng tinh khiết và tính chính xác tuyệt đối của đường may.",
            videoSubtitle: "BẢN SẮC ĐƠN SẮC · PHIM TƯ LIỆU",
          },
          collage: {
            eyebrow: "CHƯƠNG 03 · TUYỂN TẬP HÌNH ẢNH",
            title: "COLLAGE",
            subtitle: "LOOKBOOK",
            description: "Sự đối thoại giữa phom dáng tối giản và không gian kiến trúc. Khám phá toàn cảnh các thiết kế được ghi hình qua lăng kính điện ảnh đương đại.",
            cta: "KHÁM PHÁ TOÀN BỘ BỘ SƯU TẬP",
          },
          boutique: {
            eyebrow: "CHƯƠNG 05 · KHÔNG GIAN TRƯNG BÀY",
            title: "ATELIER BOUTIQUE",
            description: "Những tạo tác may đo được tuyển chọn kỹ lưỡng từ xưởng thiết kế, sẵn sàng cho trải nghiệm thường nhật tinh tế.",
            cta: "XEM TOÀN BỘ CỬA HÀNG",
          },
          newsletter: {
            eyebrow: "KẾT NỐI ĐỘC QUYỀN",
            title: "NHẬN THƯ TỪ ATELIER",
            description: "Đăng ký nhận thư riêng thông báo các buổi ra mắt ấn bản giới hạn và đặc quyền từ xưởng may.",
            placeholder: "Nhập địa chỉ email của bạn...",
            buttonText: "ĐĂNG KÝ",
            privacyText: "Chúng tôi tôn trọng sự riêng tư và cam kết không gửi thư rác.",
          },
          footer: {
            atelierEdition: "Atelier Edition",
            aboutText: "Thương hiệu thời trang may đo độc bản hướng tới cấu trúc thuần khiết, chất liệu cao cấp và sự tự do biểu cảm.",
          },
        },
      },
    },
    { upsert: true }
  );
  console.log("  ✓ Đã seed Cài đặt website & nội dung trang chủ đầy đủ");

  // -------------------------------------------------------------------------
  // 9. ĐƠN HÀNG Ở ĐỦ 5 TRẠNG THÁI (Orders)
  // -------------------------------------------------------------------------
  console.log("\n[9/10] Seed đơn hàng ở đủ trạng thái...");
  const orderStatuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
  const paymentMethods = ["cod", "vnpay", "momo"];
  const firstProd = seededProducts[0] || {};

  for (let i = 0; i < orderStatuses.length; i++) {
    const st = orderStatuses[i];
    const pm = paymentMethods[i % paymentMethods.length];
    const isPaid = ["delivered", "shipping"].includes(st);

    const order = await Order.findOneAndUpdate(
      { transaction_id: `WF_SEED_ORDER_STATUS_${st.toUpperCase()}` },
      {
        $set: {
          user_id: customerUser._id,
          total_price: 1850000 + i * 100000,
          original_price: 2200000 + i * 100000,
          discount_amount: 350000,
          status: st,
          payment_method: pm,
          payment_status: isPaid ? "paid" : "pending",
          transaction_id: `WF_SEED_ORDER_STATUS_${st.toUpperCase()}`,
          paid_at: isPaid ? new Date() : null,
          stock_deducted: true,
          shipping_address: {
            full_name: "Khách Hàng Thân Thiết",
            phone: "0987654321",
            city: "Hà Nội",
            district: "Quận Hoàn Kiếm",
            ward: "Phường Hàng Bài",
            address_detail: "123 Phố Huế, Hoàn Kiếm, Hà Nội",
          },
        },
      },
      { upsert: true, new: true }
    );

    await OrderItem.deleteMany({ order_id: order._id });
    await OrderItem.create({
      order_id: order._id,
      product_id: firstProd._id,
      quantity: 1,
      price: firstProd.new_price || 1850000,
      product_name: firstProd.name || "Áo Blazer Len Dệt Cấu Trúc Navy",
      product_image: "/uploads/product-navy-blazer.webp",
      product_slug: firstProd.slug || "ao-blazer-len-det-cau-truc-navy",
    });
  }
  console.log("  ✓ Đã seed đơn hàng ở 5 trạng thái (pending, confirmed, shipping, delivered, cancelled)");

  // -------------------------------------------------------------------------
  // 10. ĐÁNH GIÁ (Reviews) & HỘI THOẠI CHAT
  // -------------------------------------------------------------------------
  console.log("\n[10/10] Seed đánh giá & hội thoại chat...");
  if (firstProd._id) {
    await Review.findOneAndUpdate(
      { product_id: firstProd._id, user_id: customerUser._id },
      {
        $set: {
          product_id: firstProd._id,
          user_id: customerUser._id,
          rating: 5,
          content: {
            text: "Chất liệu len dệt vô cùng đứng phom, đường may tỉ mỉ đúng chuẩn may đo cao cấp. Rất hài lòng!",
            images: ["/uploads/product-navy-blazer.webp"],
            videos: [],
          },
          likes_count: 8,
        },
      },
      { upsert: true }
    );
  }

  // Conversation & Messages
  const conv = await Conversation.findOneAndUpdate(
    { user: customerUser._id, type: "support" },
    {
      $set: {
        user: customerUser._id,
        type: "support",
        status: "active",
        title: "Tư vấn chọn size áo Blazer may đo",
        lastMessage: "Dạ vâng, với số đo của anh/chị thì size L sẽ vừa vặn và thoải mái nhất ạ.",
        lastMessageAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  await Message.deleteMany({ conversation: conv._id });
  await Message.create([
    {
      conversation: conv._id,
      role: "user",
      content: "Chào bạn, mình cao 1m78 nặng 72kg thì nên chọn size gì cho mẫu áo Blazer Len Dệt?",
    },
    {
      conversation: conv._id,
      role: "admin",
      content: "Dạ chào quý khách! Với chiều cao 1m78 và cân nặng 72kg, phom may đo của mẫu Blazer Len Dệt size L sẽ tạo tỷ lệ vai và ngực chuẩn nhất ạ. Quý khách có thể xem thêm bảng size chi tiết trên trang sản phẩm nhé!",
    },
  ]);
  console.log("  ✓ Đã seed đánh giá sản phẩm và hội thoại chat mẫu");

  await mongoose.disconnect();
  console.log("\n🎉 HOÀN TẤT SEED TOÀN BỘ DỮ LIỆU DEV THÀNH CÔNG RỰC RỠ!");
  process.exit(0);
}

// Chạy trực tiếp
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCompleteSeed().catch((err) => {
    console.error("Lỗi seed:", err.message);
    process.exit(1);
  });
}
