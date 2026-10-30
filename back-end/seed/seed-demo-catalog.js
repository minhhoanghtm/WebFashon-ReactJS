import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../src/modules/categories/category.model.js";
import { Product, ProductVariant } from "../src/modules/products/product.model.js";
import User from "../src/modules/users/user.model.js";
import { Order, OrderItem } from "../src/modules/orders/order.model.js";

dotenv.config();

const image = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const categories = [
  ["ao-thun", "Áo thun", "1521572163474-6864f9cf17ab"],
  ["ao-so-mi", "Áo sơ mi", "1603252109303-2751441dd157"],
  ["ao-khoac", "Áo khoác", "1523398002811-999ca8dec234"],
  ["quan-jeans", "Quần jeans", "1541099649105-f69ad21f3246"],
  ["quan-tay", "Quần tây", "1506629905607-4b3d2d4e5c88"],
  ["quan-short", "Quần short", "1591195853828-11db59a44f6b"],
].map(([slug, name, imageId]) => ({ slug, name, image: image(imageId) }));

const products = [
  ["ao-thun-oversize-essential", "Áo thun oversize Essential", "ao-thun", "1521572163474-6864f9cf17ab", 320000, 259000, 128, 4.6, true, "Đen", "M"],
  ["ao-so-mi-oxford-basic", "Áo sơ mi Oxford Basic", "ao-so-mi", "1603252109303-2751441dd157", 540000, 469000, 74, 4.4, true, "Trắng", "M"],
  ["ao-khoac-bomber-street", "Áo khoác bomber Street", "ao-khoac", "1523398002811-999ca8dec234", 890000, 749000, 39, 4.8, false, "Đen", "L"],
  ["ao-thun-graphic-mono-line", "Áo thun graphic Mono Line", "ao-thun", "1576566588028-4147f3842f27", 360000, 299000, 96, 4.5, true, "Trắng", "M"],
  ["ao-so-mi-linen-summer", "Áo sơ mi linen Summer", "ao-so-mi", "1596755094514-f87e34085b2c", 590000, 519000, 51, 4.3, true, "Trắng", "L"],
  ["ao-khoac-denim-washed-blue", "Áo khoác denim Washed Blue", "ao-khoac", "1542272604-787c3835535d", 920000, 798000, 33, 4.7, true, "Xanh", "L"],
  ["quan-jeans-straight-fit-urban", "Quần jeans straight fit Urban", "quan-jeans", "1541099649105-f69ad21f3246", 690000, 599000, 112, 4.6, true, "Xanh đậm", "32"],
  ["quan-jeans-baggy-vintage-fade", "Quần jeans baggy Vintage Fade", "quan-jeans", "1473966968600-fa801b869a1a", 760000, 649000, 67, 4.5, false, "Xanh", "32"],
  ["quan-tay-slim-office-pro", "Quần tây slim Office Pro", "quan-tay", "1506629905607-4b3d2d4e5c88", 620000, 559000, 85, 4.4, true, "Đen", "32"],
  ["quan-tay-relaxed-premium", "Quần tây relaxed Premium", "quan-tay", "1515886657613-9f3515b0c78f", 680000, 615000, 44, 4.2, true, "Be", "32"],
  ["quan-short-kaki-daily-wear", "Quần short kaki Daily Wear", "quan-short", "1591195853828-11db59a44f6b", 390000, 329000, 153, 4.7, true, "Be", "M"],
  ["quan-short-thun-sport-flex", "Quần short thun Sport Flex", "quan-short", "1503342217505-b0a15ec3261c", 340000, 289000, 119, 4.5, true, "Đen", "M"],
].map(([slug, name, categorySlug, imageId, oldPrice, newPrice, sold, rating, isActive, color, size]) => ({
  slug,
  name,
  categorySlug,
  imageUrl: image(imageId),
  oldPrice,
  newPrice,
  sold,
  rating,
  isActive,
  color,
  size,
}));

const demoUsers = [
  ["admin404@demo.local", "Nguyễn Minh Quân", "admin", "0901234567", "TP. Hồ Chí Minh", "Quận 3", "12 Võ Văn Tần"],
  ["linh.admin@demo.local", "Trần Hải Linh", "admin", "0912345678", "Hà Nội", "Cầu Giấy", "88 Duy Tân"],
  ["nam.nguyen@demo.local", "Nguyễn Văn Nam", "user", "0912345678", "TP. Hồ Chí Minh", "Gò Vấp", "25 Nguyễn Văn Nghi"],
  ["ngocpham@demo.local", "Phạm Thị Ngọc", "user", "0981112233", "Đà Nẵng", "Hải Châu", "45 Nguyễn Văn Linh"],
  ["hoangvu@demo.local", "Lê Hoàng Vũ", "user", "0938123456", "TP. Hồ Chí Minh", "Bình Thạnh", "20 Điện Biên Phủ"],
  ["maianh.shop@demo.local", "Đỗ Mai Anh", "user", "0977332211", "Hà Nội", "Đống Đa", "55 Thái Hà"],
  ["truongpham@demo.local", "Phạm Đức Trường", "user", "0965221100", "Cần Thơ", "Ninh Kiều", "17 Trần Hưng Đạo"],
];

const upsertDemoData = async () => {
  const categoryBySlug = new Map();
  for (const category of categories) {
    const saved = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    categoryBySlug.set(category.slug, saved);
  }

  const productBySlug = new Map();
  for (const item of products) {
    const category = categoryBySlug.get(item.categorySlug);
    const saved = await Product.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          name_no_accents: item.name,
          category_id: category._id,
          displayProduct: [item.imageUrl],
          description: `${item.name} — sản phẩm demo được quản lý từ backend.`,
          old_price: item.oldPrice,
          new_price: item.newPrice,
          stock: 100,
          weight: 0.5,
          sold: item.sold,
          rating: item.rating,
          is_active: item.isActive,
          is_featured: item.sold >= 100,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    await ProductVariant.findOneAndUpdate(
      { product_id: saved._id, color: item.color, size: item.size },
      { $set: { image_url: item.imageUrl, stock: 100 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    productBySlug.set(item.slug, saved);
  }

  const passwordHash = await bcrypt.hash("Demo@123456", 10);
  const userByEmail = new Map();
  for (const [email, fullName, role, phone, city, district, addressDetail] of demoUsers) {
    const saved = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { passWord: passwordHash },
        $set: {
          fullName,
          role,
          status: "active",
          addresses: [{ fullName, phone, addressDetail, isDefault: true }],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    userByEmail.set(email, { user: saved, city, district, addressDetail, phone });
  }

  const customer = userByEmail.get("nam.nguyen@demo.local");
  const orderSpecs = [
    ["DEMO-ORDER-1001", "delivered", "cod", "ao-thun-oversize-essential", 2],
    ["DEMO-ORDER-1002", "shipping", "momo", "ao-khoac-bomber-street", 1],
    ["DEMO-ORDER-1003", "confirmed", "vnpay", "quan-jeans-straight-fit-urban", 1],
  ];
  for (const [transactionId, status, paymentMethod, productSlug, quantity] of orderSpecs) {
    const product = productBySlug.get(productSlug);
    const totalPrice = product.new_price * quantity;
    const order = await Order.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        $set: {
          user_id: customer.user._id,
          total_price: totalPrice,
          original_price: totalPrice,
          status,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "paid",
          stock_deducted: status === "delivered",
          shipping_address: {
            full_name: customer.user.fullName,
            phone: customer.phone,
            city: customer.city,
            district: customer.district,
            ward: "Phường mẫu",
            address_detail: customer.addressDetail,
          },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const variant = await ProductVariant.findOne({ product_id: product._id });
    await OrderItem.findOneAndUpdate(
      { order_id: order._id, product_id: product._id },
      {
        $set: {
          variant_id: variant?._id,
          quantity,
          price: product.new_price,
          product_name: product.name,
          product_image: product.displayProduct?.[0] || "",
          product_slug: product.slug,
          original_price: product.old_price,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
};

const run = async () => {
  const mongoUri = process.env.MONGO_CONNECTIONSTRING;
  if (!mongoUri) throw new Error("MONGO_CONNECTIONSTRING is not defined in the .env file");
  await mongoose.connect(mongoUri);
  await upsertDemoData();
  console.log(`Seeded ${categories.length} categories, ${products.length} products, ${demoUsers.length} users and 3 orders.`);
  console.log("Demo accounts use the password Demo@123456.");
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Demo seed failed:", error);
  await mongoose.connection.close();
  process.exitCode = 1;
});
