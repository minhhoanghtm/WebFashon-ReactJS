import Product, { ProductVariant } from "../../../products/product.model.js";
import Category from "../../../categories/category.model.js";
import { Order, OrderItem } from "../../../orders/order.model.js";
import Voucher from "../../../vouchers/voucher.model.js";
import Review from "../../../reviews/review.model.js";
import { toNoAccent } from "../../../../common/utils/removeAccents.js";

const ORDER_STATUS_MAP = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
  returned: "Đã hoàn hàng",
};

const parsePrice = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    let clean = val.toLowerCase().trim();
    const hasMultiplier = /[ktrm]/.test(clean);
    
    if (hasMultiplier) {
      clean = clean.replace(/,/g, ".");
      clean = clean.replace(/[^\d.ktr]/g, ""); 
      
      if (clean.includes("k")) {
        const num = parseFloat(clean.replace("k", ""));
        return isNaN(num) ? undefined : Math.round(num * 1000);
      }
      if (clean.includes("tr")) {
        const num = parseFloat(clean.replace("tr", ""));
        return isNaN(num) ? undefined : Math.round(num * 1000000);
      }
      if (clean.includes("m")) {
        const num = parseFloat(clean.replace("m", ""));
        return isNaN(num) ? undefined : Math.round(num * 1000000);
      }
    } else {
      clean = clean.replace(/[.\sđ₫]|vnd/g, "").replace(/,/g, "");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
};

export const executeTool = async (toolName, args, { userId } = {}) => {
  try {
    switch (toolName) {
      case "search_products": {
        const query = { is_active: true };

        if (args.keyword) {
          query.$or = [
            { name: { $regex: args.keyword, $options: "i" } },
            { name_no_accents: { $regex: args.keyword, $options: "i" } },
          ];
        }
        if (args.category_slug) {
          // Tìm category_id từ slug
          const cat = await Category.findOne({ slug: args.category_slug });
          if (cat) query.category_id = cat._id.toString();
        }
        const maxPrice = parsePrice(args.maxPrice || args.max_price);
        const minPrice = parsePrice(args.minPrice || args.min_price);

        if (minPrice !== undefined || maxPrice !== undefined) {
          query.new_price = {};

          if (minPrice !== undefined) query.new_price.$gte = minPrice;
          if (maxPrice !== undefined) query.new_price.$lte = maxPrice;
        }

        const products = await Product.find(query)
          .limit(5)
          .select(
            "_id name slug new_price old_price displayProduct rating sold is_active",
          );

        if (!products.length) return "Không tìm thấy sản phẩm phù hợp.";

        return products.map((p) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          new_price: p.new_price?.toLocaleString("vi-VN") + "đ",
          old_price: p.old_price?.toLocaleString("vi-VN") + "đ",
          rating: p.rating,
          sold: p.sold,
          image: p.displayProduct?.[0] || null,
        }));
      }

      case "get_product_detail":
      case "get_product_details": {
        const identifier = args.product_id || args.slug || args.keyword || args.name;
        let product = null;

        if (identifier) {
          if (/^[a-f\d]{24}$/i.test(identifier)) {
            product = await Product.findById(identifier);
          }
          if (!product) {
            const cleanTerm = toNoAccent(String(identifier).trim());
            const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            product = await Product.findOne({
              is_active: true,
              $or: [
                { slug: identifier },
                { slug: { $regex: escaped, $options: "i" } },
                { name_no_accents: { $regex: escaped, $options: "i" } },
                { name: { $regex: escaped, $options: "i" } },
              ],
            });
          }
        }

        if (!product) return "Không tìm thấy sản phẩm.";

        const variants = await ProductVariant.find({
          product_id: product._id.toString(),
        }).select("color size stock image_url");

        // Nhóm theo màu và size còn hàng
        const inStock = variants.filter((v) => v.stock > 0);
        const colors = [...new Set(inStock.map((v) => v.color))];
        const sizes = [...new Set(inStock.map((v) => v.size))];

        return {
          id: product._id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          new_price: product.new_price?.toLocaleString("vi-VN") + "đ",
          old_price: product.old_price?.toLocaleString("vi-VN") + "đ",
          rating: product.rating,
          sold: product.sold,
          available_colors: colors,
          available_sizes: sizes,
          total_stock: inStock.reduce((sum, v) => sum + v.stock, 0),
        };
      }

      case "check_order_status": {
        if (!userId) return "Bạn cần đăng nhập để xem đơn hàng.";

        const order = await Order.findOne({
          _id: args.order_id,
          user_id: userId,
        });

        if (!order)
          return "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn.";

        const items = await OrderItem.find({
          order_id: order._id.toString(),
        }).select("product_name quantity price product_image");

        return {
          order_id: order._id,
          status: ORDER_STATUS_MAP[order.status] || order.status,
          payment_method:
            order.payment_method === "cod"
              ? "Thanh toán khi nhận hàng"
              : order.payment_method,
          payment_status:
            order.payment_status === "pending"
              ? "Chưa thanh toán"
              : "Đã thanh toán",
          total_price: order.total_price?.toLocaleString("vi-VN") + "đ",
          shipping_address: order.shipping_address,
          created_at: new Date(order.createdAt).toLocaleDateString("vi-VN"),
          items: items.map((i) => ({
            name: i.product_name,
            quantity: i.quantity,
            price: i.price?.toLocaleString("vi-VN") + "đ",
          })),
        };
      }

      case "get_my_orders": {
        if (!userId) return "Bạn cần đăng nhập để xem đơn hàng.";

        const limit = args.limit || 3;

        const orders = await Order.find({ user_id: userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .select("_id status total_price createdAt payment_method");

        if (!orders.length) return "Bạn chưa có đơn hàng nào.";

        return orders.map((o) => ({
          order_id: o._id,
          status: ORDER_STATUS_MAP[o.status] || o.status,
          total_price: o.total_price?.toLocaleString("vi-VN") + "đ",
          created_at: new Date(o.createdAt).toLocaleDateString("vi-VN"),
        }));
      }

      case "get_vouchers": {
        const now = new Date();

        const vouchers = await Voucher.find({
          status: "ACTIVE",
          isDeleted: false,
          startDate: { $lte: now },
          endDate: { $gte: now },
        }).select(
          "code discountType discountValue minOrderValue description",
        );

        if (!vouchers.length) return "Hiện không có mã giảm giá nào.";

        return vouchers.map((v) => ({
          code: v.code,
          discount:
            v.discountType === "percentage"
              ? `Giảm ${v.discountValue}%`
              : `Giảm ${v.discountValue?.toLocaleString("vi-VN")}đ`,
          min_order: v.minOrderValue
            ? `Đơn tối thiểu ${v.minOrderValue?.toLocaleString("vi-VN")}đ`
            : "Không giới hạn",
          description: v.description || "",
        }));
      }

      case "get_categories": {
        const cats = await Category.find().select("name slug");
        return cats.map((c) => ({ name: c.name, slug: c.slug }));
      }

      case "get_product_reviews": {
        const identifier = args.product_id || args.slug || args.keyword || args.name;
        let product = null;

        if (identifier) {
          if (/^[a-f\d]{24}$/i.test(identifier)) {
            product = await Product.findById(identifier);
          }
          if (!product) {
            const cleanTerm = toNoAccent(String(identifier).trim());
            const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            product = await Product.findOne({
              is_active: true,
              $or: [
                { slug: identifier },
                { slug: { $regex: escaped, $options: "i" } },
                { name_no_accents: { $regex: escaped, $options: "i" } },
                { name: { $regex: escaped, $options: "i" } },
              ],
            });
          }
        }

        const targetId = product ? product._id : identifier;
        const reviews = await Review.find({ product_id: targetId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("rating content createdAt");

        if (!reviews.length) return "Sản phẩm chưa có đánh giá nào.";

        const avgRating = (
          reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        ).toFixed(1);

        return {
          average_rating: avgRating,
          total_reviews: reviews.length,
          reviews: reviews.map((r) => ({
            rating: r.rating + "/5",
            comment: r.content?.text || "",
            date: new Date(r.createdAt).toLocaleDateString("vi-VN"),
          })),
        };
      }

      default:
        return `Tool "${toolName}" không được hỗ trợ.`;
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return `Lỗi khi thực thi: ${error.message}`;
  }
};
