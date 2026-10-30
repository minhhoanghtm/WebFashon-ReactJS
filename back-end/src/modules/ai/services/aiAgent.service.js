import { z } from "zod";
import mongoose from "mongoose";
import semanticSearchService, { parseNaturalLanguageQuery } from "./semanticSearch.service.js";
import ragService from "./rag.service.js";
import cartService from "../../carts/cart.service.js";
import Product, { ProductVariant } from "../../products/product.model.js";
import Category from "../../categories/category.model.js";
import { Order, OrderItem } from "../../orders/order.model.js";
import Voucher from "../../vouchers/voucher.model.js";
import Review from "../../reviews/review.model.js";
import pricingService from "../../campaigns/pricing.service.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import logger from "../../../common/logger.js";
import crypto from "crypto";

const ACTION_SECRET =
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "webfashion_action_salt_404";

/**
 * Generate a cryptographically signed action token bound to userId, items digest, and expiration.
 */
export function generateActionToken({ actionId, userId, items, expiresAt }) {
  const itemsDigest = (items || [])
    .map(
      (it) =>
        `${it.product_id || it.productId}:${it.variant_id || it.variantId || ""}:${it.quantity}`
    )
    .sort()
    .join(";");
  const payload = `${actionId}::${userId}::${itemsDigest}::${expiresAt}`;
  return crypto.createHmac("sha256", ACTION_SECRET).update(payload).digest("hex");
}

/**
 * Verify whether an actionToken matches the expected HMAC signature and has not expired.
 */
export function verifyActionToken({ actionId, userId, items, expiresAt, actionToken }) {
  if (!actionId || !userId || !expiresAt || !actionToken) return false;
  if (Date.now() > Number(expiresAt)) return false;
  const expected = generateActionToken({ actionId, userId, items, expiresAt });
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actionToken));
  } catch {
    return false;
  }
}

const ORDER_STATUS_MAP = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  shipped: "Đã gửi hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
  returned: "Đã hoàn hàng",
};

// ============================================================================
// ZOD VALIDATION SCHEMAS FOR AGENT TOOLS
// ============================================================================

const searchProductsArgsSchema = z.object({
  keyword: z.string().max(300).optional(),
  query: z.string().max(300).optional(),
  category_slug: z.string().max(100).optional(),
  min_price: z.union([z.number(), z.string()]).optional(),
  max_price: z.union([z.number(), z.string()]).optional(),
  color: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  in_stock: z.boolean().optional(),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

const getProductDetailsArgsSchema = z
  .object({
    product_id: z.string().max(200).optional(),
    slug: z.string().max(200).optional(),
    keyword: z.string().max(200).optional(),
  })
  .refine((d) => Boolean(d.product_id || d.slug || d.keyword), {
    message: "Cần cung cấp ít nhất một trong: product_id, slug hoặc keyword",
  });

const addToCartItemSchema = z
  .object({
    product_id: z.string().optional(),
    productId: z.string().optional(),
    variant_id: z.string().nullable().optional(),
    variantId: z.string().nullable().optional(),
    color: z.string().max(50).optional(),
    size: z.string().max(20).optional(),
    quantity: z.number().int().min(1).max(10).optional().default(1),
  })
  .transform((d) => ({
    ...d,
    product_id: d.product_id || d.productId || "",
    variant_id: d.variant_id || d.variantId || null,
  }))
  .refine((d) => d.product_id.length > 0, {
    message: "product_id là bắt buộc",
  });

const addToCartArgsSchema = z
  .object({
    product_id: z.string().optional(),
    productId: z.string().optional(),
    variant_id: z.string().nullable().optional(),
    variantId: z.string().nullable().optional(),
    color: z.string().max(50).optional(),
    size: z.string().max(20).optional(),
    quantity: z.number().int().min(1).max(10).optional().default(1),
    items: z.array(addToCartItemSchema).max(5, "Tối đa 5 sản phẩm mỗi lần thêm").optional(),
    confirmed: z.boolean().optional().default(false),
  })
  .transform((d) => ({
    ...d,
    product_id: d.product_id || d.productId,
    variant_id: d.variant_id || d.variantId,
  }));

const checkOrderStatusArgsSchema = z.object({
  order_id: z.string().min(1, "order_id là bắt buộc").max(100),
});

const getMyOrdersArgsSchema = z.object({
  limit: z.number().int().min(1).max(10).optional().default(3),
});

const searchKnowledgeBaseArgsSchema = z.object({
  query: z.string().min(1, "query là bắt buộc").max(500),
});

const getProductReviewsArgsSchema = z.object({
  product_id: z.string().min(1, "product_id là bắt buộc").max(200),
});

function parseFlexiblePrice(val) {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  if (typeof val === "string") {
    const parsedNL = parseNaturalLanguageQuery(`dưới ${val}`);
    if (parsedNL.extractedFilters.maxPrice !== null) {
      return parsedNL.extractedFilters.maxPrice;
    }
    const clean = val.replace(/[.\sđ₫,]|vnd/gi, "");
    const num = Number(clean);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

export class AiToolRegistry {
  constructor() {
    this.metrics = {
      totalToolCalls: 0,
      successfulCalls: 0,
      blockedAuthCalls: 0,
      validationFailures: 0,
      pendingConfirmations: 0,
      confirmedActionsExecuted: 0,
    };
  }

  /**
   * Return OpenAI/OpenRouter function calling tool definitions
   */
  getToolDefinitions() {
    return [
      {
        name: "search_products",
        description:
          "Tìm kiếm sản phẩm theo ngữ nghĩa (Semantic Search), tên, công dụng, phong cách, danh mục, khoảng giá và tồn kho. Dùng khi khách tìm sản phẩm như 'áo mặc đi biển dưới 500k', 'tìm 3 áo thun dưới 300k', 'quần công sở lịch sự'.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "Mô tả ngữ nghĩa hoặc từ khóa sản phẩm cần tìm",
            },
            category_slug: {
              type: "string",
              description: "Slug danh mục sản phẩm nếu có",
            },
            min_price: {
              type: "number",
              description: "Giá tối thiểu (VND), ví dụ: 100000",
            },
            max_price: {
              type: "number",
              description: "Giá tối đa (VND), ví dụ: 500000",
            },
            color: {
              type: "string",
              description: "Màu sắc mong muốn nếu có",
            },
            size: {
              type: "string",
              description: "Kích thước (S, M, L, XL...) nếu có",
            },
            in_stock: {
              type: "boolean",
              description: "Chỉ lấy sản phẩm còn hàng (mặc định true khi khách muốn mua)",
            },
            limit: {
              type: "number",
              description: "Số lượng sản phẩm tối đa cần tìm (1 đến 10)",
            },
          },
        },
      },
      {
        name: "get_product_details",
        description:
          "Lấy thông tin chi tiết của sản phẩm (giá, màu sắc, kích thước, tồn kho từng biến thể, mô tả) bằng ID, slug hoặc tên sản phẩm.",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string", description: "ID hoặc Tên sản phẩm" },
            slug: { type: "string", description: "Slug của sản phẩm" },
            keyword: { type: "string", description: "Từ khóa tên sản phẩm" },
          },
        },
      },
      {
        name: "add_to_cart",
        description:
          "Thêm một hoặc nhiều sản phẩm vào giỏ hàng của người dùng. Hệ thống sẽ tự động kiểm tra tồn kho, giá thực tế và yêu cầu người dùng xác nhận nếu chưa có xác nhận.",
        parameters: {
          type: "object",
          properties: {
            product_id: {
              type: "string",
              description: "ID sản phẩm (24 ký tự hex ObjectId) nếu thêm 1 sản phẩm",
            },
            color: { type: "string", description: "Màu sắc sản phẩm (tùy chọn)" },
            size: { type: "string", description: "Kích thước sản phẩm (tùy chọn)" },
            quantity: { type: "number", description: "Số lượng (mặc định 1, tối đa 10)" },
            items: {
              type: "array",
              description: "Danh sách nhiều sản phẩm cần thêm vào giỏ hàng",
              items: {
                type: "object",
                properties: {
                  product_id: { type: "string", description: "ID sản phẩm (ObjectId)" },
                  color: { type: "string" },
                  size: { type: "string" },
                  quantity: { type: "number" },
                },
                required: ["product_id"],
              },
            },
          },
        },
      },
      {
        name: "get_my_cart",
        description: "Xem danh sách sản phẩm hiện có trong giỏ hàng của người dùng đang đăng nhập.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "check_order_status",
        description: "Kiểm tra trạng thái và chi tiết đơn hàng của người dùng theo order_id.",
        parameters: {
          type: "object",
          properties: {
            order_id: { type: "string", description: "Mã ID của đơn hàng" },
          },
          required: ["order_id"],
        },
      },
      {
        name: "get_my_orders",
        description: "Lấy danh sách các đơn hàng gần đây của người dùng đang đăng nhập.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Số đơn hàng muốn xem (mặc định 3)" },
          },
        },
      },
      {
        name: "get_vouchers",
        description: "Lấy danh sách mã giảm giá (voucher) đang hoạt động của cửa hàng.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_categories",
        description: "Lấy danh sách các danh mục sản phẩm hiện có tại cửa hàng.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_product_reviews",
        description: "Xem đánh giá (reviews) của khách hàng về một sản phẩm.",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string", description: "ID hoặc tên sản phẩm" },
          },
          required: ["product_id"],
        },
      },
      {
        name: "search_knowledge_base",
        description:
          "Tra cứu chính sách đổi trả, bảo hành, giao hàng, câu hỏi thường gặp (FAQ), hướng dẫn chọn size, thông tin liên hệ cửa hàng bằng RAG Vector Search.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Câu hỏi hoặc chủ đề cần tra cứu (ví dụ: chính sách đổi trả, hotline, giờ mở cửa)",
            },
          },
          required: ["query"],
        },
      },
    ];
  }

  /**
   * Execute a registered tool with strict schema validation, authz, and confirmation gate
   */
  async executeTool(toolName, rawArgs = {}, authContext = {}) {
    this.metrics.totalToolCalls++;
    const userId = authContext?.userId || null;
    const userRole = authContext?.role || "user";

    try {
      switch (toolName) {
        case "search_products": {
          const parsed = searchProductsArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "INVALID_TOOL_ARGS",
              message: `Tham số tìm kiếm không hợp lệ: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
            };
          }

          const args = parsed.data;
          const minPrice = parseFlexiblePrice(args.min_price ?? rawArgs.minPrice);
          const maxPrice = parseFlexiblePrice(args.max_price ?? rawArgs.maxPrice);
          const queryText = (args.keyword || args.query || "thời trang").trim();

          const searchRes = await semanticSearchService.search(
            {
              query: queryText,
              sourceType: "product",
              categorySlug: args.category_slug,
              minPrice,
              maxPrice,
              color: args.color,
              size: args.size,
              inStock: args.in_stock ?? true,
              topK: args.limit || 5,
            },
            { userId, role: userRole }
          );

          if (!searchRes.results || searchRes.results.length === 0) {
            return "Không tìm thấy sản phẩm phù hợp với yêu cầu của bạn.";
          }

          this.metrics.successfulCalls++;
          return searchRes.results.map((r) => ({
            id: r.sourceId,
            name: r.title || r.metadata?.name,
            slug: r.metadata?.slug,
            price_number: r.metadata?.price,
            new_price: `${Number(r.metadata?.price || 0).toLocaleString("vi-VN")}đ`,
            old_price: `${Number(r.metadata?.oldPrice || r.metadata?.price || 0).toLocaleString("vi-VN")}đ`,
            stock: r.metadata?.stock ?? 0,
            in_stock: Boolean(r.metadata?.inStock),
            available_colors: r.metadata?.colors || [],
            available_sizes: r.metadata?.sizes || [],
            rating: r.metadata?.rating || 0,
            sold: r.metadata?.sold || 0,
            image: r.metadata?.image || null,
            similarity_score: r.score,
          }));
        }

        case "get_product_detail":
        case "get_product_details": {
          const normalizedInput = {
            product_id: rawArgs?.product_id || rawArgs?.name,
            slug: rawArgs?.slug,
            keyword: rawArgs?.keyword,
          };
          const parsed = getProductDetailsArgsSchema.safeParse(normalizedInput);
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "INVALID_TOOL_ARGS",
              message: parsed.error.issues.map((i) => i.message).join(", "),
            };
          }

          const identifier =
            parsed.data.product_id || parsed.data.slug || parsed.data.keyword;
          let product = null;

          if (/^[a-f\d]{24}$/i.test(identifier)) {
            product = await Product.findOne({ _id: identifier, is_active: true }).lean();
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
            }).lean();
          }

          // Fallback to semantic search if regex didn't find exact name
          if (!product) {
            const semRes = await semanticSearchService.search(
              { query: identifier, sourceType: "product", topK: 1 },
              { userId, role: userRole }
            );
            const bestId = semRes.results?.[0]?.sourceId;
            if (bestId && /^[a-f\d]{24}$/i.test(bestId)) {
              product = await Product.findOne({ _id: bestId, is_active: true }).lean();
            }
          }

          if (!product) return "Không tìm thấy sản phẩm.";

          const [variants, resolvedPrice] = await Promise.all([
            ProductVariant.find({ product_id: product._id })
              .select("_id color size stock image_url")
              .lean(),
            pricingService.resolvePrice(product).catch(() => null),
          ]);

          const inStock = variants.filter((v) => Number(v.stock || 0) > 0);
          const colors = [...new Set(inStock.map((v) => v.color).filter(Boolean))];
          const sizes = [...new Set(inStock.map((v) => v.size).filter(Boolean))];
          const totalStock =
            variants.length > 0
              ? inStock.reduce((sum, v) => sum + Number(v.stock || 0), 0)
              : Number(product.stock || 0);
          const finalPrice = Number(resolvedPrice?.finalPrice ?? product.new_price ?? 0);

          this.metrics.successfulCalls++;
          return {
            id: String(product._id),
            name: product.name,
            slug: product.slug,
            description: product.description,
            price_number: finalPrice,
            new_price: `${finalPrice.toLocaleString("vi-VN")}đ`,
            old_price: `${Number(product.old_price || finalPrice).toLocaleString("vi-VN")}đ`,
            rating: product.rating,
            sold: product.sold,
            available_colors: colors,
            available_sizes: sizes,
            total_stock: totalStock,
            image: product.displayProduct?.[0] || variants[0]?.image_url || null,
            variants: inStock.map((v) => ({
              variant_id: String(v._id),
              color: v.color,
              size: v.size,
              stock: v.stock,
            })),
          };
        }

        case "add_to_cart": {
          // 1. Validate schema
          const parsed = addToCartArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "INVALID_TOOL_ARGS",
              message: `Tham số thêm vào giỏ hàng không hợp lệ: ${parsed.error.issues
                .map((i) => i.message)
                .join(", ")}`,
            };
          }

          // 2. Enforce authentication & role authorization (same as /api/cart_items)
          if (!userId) {
            this.metrics.blockedAuthCalls++;
            return {
              success: false,
              code: "AUTH_REQUIRED",
              message:
                "Bạn cần đăng nhập tài khoản khách hàng trước khi thêm sản phẩm vào giỏ hàng.",
            };
          }
          if (userRole === "admin") {
            this.metrics.blockedAuthCalls++;
            return {
              success: false,
              code: "FORBIDDEN_ROLE",
              message: "Quản trị viên không được phép thực hiện thao tác giỏ hàng khách hàng.",
            };
          }

          // Normalize requested items list
          const rawItems =
            Array.isArray(parsed.data.items) && parsed.data.items.length > 0
              ? parsed.data.items
              : parsed.data.product_id
              ? [
                  {
                    product_id: parsed.data.product_id,
                    variant_id: parsed.data.variant_id,
                    color: parsed.data.color,
                    size: parsed.data.size,
                    quantity: parsed.data.quantity || 1,
                  },
                ]
              : [];

          if (rawItems.length === 0) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "EMPTY_ITEMS",
              message: "Vui lòng chọn ít nhất một sản phẩm hợp lệ để thêm vào giỏ hàng.",
            };
          }

          // 3. Verify each product, real-time price, and stock in DB
          const verifiedItems = [];
          const unavailableItems = [];

          for (const reqItem of rawItems) {
            let product = null;
            if (mongoose.Types.ObjectId.isValid(reqItem.product_id)) {
              product = await Product.findOne({
                _id: reqItem.product_id,
                is_active: true,
              }).lean();
            }
            if (!product) {
              unavailableItems.push({
                product_id: reqItem.product_id,
                reason: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh",
              });
              continue;
            }

            const variants = await ProductVariant.find({ product_id: product._id }).lean();
            let chosenVariant = null;
            let availableStock = Number(product.stock || 0);

            if (variants.length > 0) {
              const inStockVariants = variants.filter((v) => Number(v.stock || 0) > 0);
              if (reqItem.variant_id && mongoose.Types.ObjectId.isValid(reqItem.variant_id)) {
                chosenVariant = inStockVariants.find(
                  (v) => String(v._id) === String(reqItem.variant_id)
                );
              }
              if (!chosenVariant && (reqItem.color || reqItem.size)) {
                chosenVariant = inStockVariants.find((v) => {
                  const matchColor =
                    !reqItem.color ||
                    toNoAccent(String(v.color || "")).toLowerCase() ===
                      toNoAccent(String(reqItem.color)).toLowerCase();
                  const matchSize =
                    !reqItem.size ||
                    String(v.size || "").toUpperCase() === String(reqItem.size).toUpperCase();
                  return matchColor && matchSize;
                });
              }
              if (!chosenVariant && inStockVariants.length > 0) {
                chosenVariant = inStockVariants[0];
              }
              availableStock = chosenVariant ? Number(chosenVariant.stock || 0) : 0;
            }

            const qty = Math.min(Math.max(Number(reqItem.quantity || 1), 1), 10);
            if (availableStock < qty) {
              unavailableItems.push({
                product_id: String(product._id),
                name: product.name,
                reason:
                  availableStock <= 0
                    ? "Sản phẩm hiện đã hết hàng"
                    : `Chỉ còn ${availableStock} sản phẩm trong kho (yêu cầu ${qty})`,
              });
              continue;
            }

            const priceInfo = await pricingService
              .resolvePrice(product, chosenVariant?._id || null, new Date(), userId)
              .catch(() => ({ finalPrice: Number(product.new_price || 0) }));

            verifiedItems.push({
              product_id: String(product._id),
              variant_id: chosenVariant ? String(chosenVariant._id) : null,
              name: product.name,
              slug: product.slug,
              color: chosenVariant?.color || reqItem.color || "Mặc định",
              size: chosenVariant?.size || reqItem.size || "Freesize",
              quantity: qty,
              unit_price: Number(priceInfo.finalPrice || product.new_price || 0),
              available_stock: availableStock,
              image:
                chosenVariant?.image_url ||
                product.displayProduct?.[0] ||
                "",
            });
          }

          if (verifiedItems.length === 0) {
            return {
              success: false,
              code: "OUT_OF_STOCK_OR_INVALID",
              message: "Không thể thêm vào giỏ hàng do sản phẩm không hợp lệ hoặc đã hết hàng.",
              unavailableItems,
            };
          }

          // 4. Require explicit user confirmation before mutating cart state.
          // State mutation is strictly gated by `authContext.isConfirmedByGate === true`
          // or explicit confirmation flag from authContext / parameters.
          const isConfirmed = Boolean(
            authContext?.isConfirmedByGate === true ||
            authContext?.confirmed === true
          );

          if (!isConfirmed) {
            this.metrics.pendingConfirmations++;
            const totalEstimatedPrice = verifiedItems.reduce(
              (sum, it) => sum + it.unit_price * it.quantity,
              0
            );

            const actionId = crypto.randomUUID();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL
            const actionToken = generateActionToken({
              actionId,
              userId: String(userId),
              items: verifiedItems,
              expiresAt,
            });

            return {
              success: true,
              status: "PENDING_CONFIRMATION",
              requiresConfirmation: true,
              actionId,
              actionType: "add_to_cart",
              actionToken,
              expiresAt,
              message:
                "Đã tìm thấy sản phẩm hợp lệ và còn hàng. Vui lòng xác nhận để thêm vào giỏ hàng của bạn.",
              items: verifiedItems,
              unavailableItems,
              totalEstimatedPrice,
              totalEstimatedPriceFormatted: `${totalEstimatedPrice.toLocaleString("vi-VN")}đ`,
            };
          }

          // 5. Execute actual CartService calls using user's identity
          let latestCartResult = null;
          for (const item of verifiedItems) {
            latestCartResult = await cartService.addCartItem(userId, {
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            });
          }

          this.metrics.confirmedActionsExecuted++;
          this.metrics.successfulCalls++;

          return {
            success: true,
            status: "EXECUTED",
            actionType: "add_to_cart",
            message: `Đã thêm thành công ${verifiedItems.length} sản phẩm vào giỏ hàng!`,
            addedItems: verifiedItems,
            unavailableItems,
            cartSummary: {
              total_items: latestCartResult?.cart?.total_items || 0,
              total_price: latestCartResult?.cart?.total_price || 0,
              total_price_formatted: `${Number(
                latestCartResult?.cart?.total_price || 0
              ).toLocaleString("vi-VN")}đ`,
            },
          };
        }

        case "get_my_cart": {
          if (!userId) {
            this.metrics.blockedAuthCalls++;
            return {
              success: false,
              code: "AUTH_REQUIRED",
              message: "Bạn cần đăng nhập để xem giỏ hàng.",
            };
          }
          if (userRole === "admin") {
            this.metrics.blockedAuthCalls++;
            return {
              success: false,
              code: "FORBIDDEN_ROLE",
              message: "Quản trị viên không có giỏ hàng mua sắm.",
            };
          }
          const carts = await cartService.getCart(userId);
          const cart = Array.isArray(carts) ? carts[0] : carts;
          if (!cart || !cart.total_items) {
            return "Giỏ hàng của bạn hiện đang trống.";
          }
          const items = await cartService.getCartItems(cart._id);
          this.metrics.successfulCalls++;
          return {
            total_items: cart.total_items,
            total_price: `${Number(cart.total_price || 0).toLocaleString("vi-VN")}đ`,
            items: (items || []).map((it) => ({
              id: String(it._id),
              product_name: it.product_id?.name || "Sản phẩm",
              quantity: it.quantity,
              price: `${Number(it.current_price ?? it.price ?? 0).toLocaleString("vi-VN")}đ`,
              color: it.variant_id?.color || "",
              size: it.variant_id?.size || "",
            })),
          };
        }

        case "check_order_status": {
          const parsed = checkOrderStatusArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "INVALID_TOOL_ARGS",
              message: "Vui lòng cung cấp mã đơn hàng (order_id) hợp lệ.",
            };
          }
          if (!userId) {
            this.metrics.blockedAuthCalls++;
            return "Bạn cần đăng nhập để kiểm tra trạng thái đơn hàng.";
          }
          if (!mongoose.Types.ObjectId.isValid(parsed.data.order_id)) {
            this.metrics.validationFailures++;
            return "Mã đơn hàng không đúng định dạng.";
          }

          // Strict ownership filter: user_id MUST match authenticated userId
          const order = await Order.findOne({
            _id: parsed.data.order_id,
            user_id: userId,
          }).lean();

          if (!order) {
            return "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc quyền truy cập của bạn.";
          }

          const items = await OrderItem.find({
            order_id: order._id.toString(),
          })
            .select("product_name quantity price product_image")
            .lean();

          this.metrics.successfulCalls++;
          return {
            order_id: String(order._id),
            status: ORDER_STATUS_MAP[order.status] || order.status,
            payment_method:
              order.payment_method === "cod"
                ? "Thanh toán khi nhận hàng"
                : order.payment_method,
            payment_status:
              order.payment_status === "pending" ? "Chưa thanh toán" : "Đã thanh toán",
            total_price: `${Number(order.total_price || 0).toLocaleString("vi-VN")}đ`,
            shipping_address: order.shipping_address,
            created_at: new Date(order.createdAt).toLocaleDateString("vi-VN"),
            items: items.map((i) => ({
              name: i.product_name,
              quantity: i.quantity,
              price: `${Number(i.price || 0).toLocaleString("vi-VN")}đ`,
            })),
          };
        }

        case "get_my_orders": {
          const parsed = getMyOrdersArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return {
              success: false,
              code: "INVALID_TOOL_ARGS",
              message: "Tham số truy vấn đơn hàng không hợp lệ.",
            };
          }
          if (!userId) {
            this.metrics.blockedAuthCalls++;
            return "Bạn cần đăng nhập để xem lịch sử đơn hàng của mình.";
          }

          const orders = await Order.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .limit(parsed.data.limit)
            .select("_id status total_price createdAt payment_method")
            .lean();

          if (!orders.length) return "Bạn chưa có đơn hàng nào.";

          this.metrics.successfulCalls++;
          return orders.map((o) => ({
            order_id: String(o._id),
            status: ORDER_STATUS_MAP[o.status] || o.status,
            total_price: `${Number(o.total_price || 0).toLocaleString("vi-VN")}đ`,
            created_at: new Date(o.createdAt).toLocaleDateString("vi-VN"),
          }));
        }

        case "get_vouchers":
        case "get_my_vouchers": {
          const now = new Date();
          const vouchers = await Voucher.find({
            status: "ACTIVE",
            isDeleted: false,
            startDate: { $lte: now },
            endDate: { $gte: now },
          })
            .select("code discountType discountValue minOrderValue description endDate")
            .lean();

          if (!vouchers.length) return "Hiện không có mã giảm giá nào đang hoạt động.";

          this.metrics.successfulCalls++;
          return vouchers.map((v) => ({
            code: v.code,
            discount:
              v.discountType === "percentage"
                ? `Giảm ${v.discountValue}%`
                : `Giảm ${Number(v.discountValue || 0).toLocaleString("vi-VN")}đ`,
            min_order: v.minOrderValue
              ? `Đơn tối thiểu ${Number(v.minOrderValue).toLocaleString("vi-VN")}đ`
              : "Không giới hạn",
            description: v.description || "",
            end_date: v.endDate ? new Date(v.endDate).toLocaleDateString("vi-VN") : "",
          }));
        }

        case "get_categories": {
          const cats = await Category.find().select("name slug").lean();
          this.metrics.successfulCalls++;
          return cats.map((c) => ({ name: c.name, slug: c.slug }));
        }

        case "get_product_reviews": {
          const parsed = getProductReviewsArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return "Vui lòng cung cấp ID hoặc tên sản phẩm để xem đánh giá.";
          }
          const identifier = parsed.data.product_id;
          let targetId = identifier;

          if (!/^[a-f\d]{24}$/i.test(identifier)) {
            const cleanTerm = toNoAccent(String(identifier).trim());
            const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const product = await Product.findOne({
              is_active: true,
              $or: [
                { slug: identifier },
                { name_no_accents: { $regex: escaped, $options: "i" } },
                { name: { $regex: escaped, $options: "i" } },
              ],
            })
              .select("_id")
              .lean();
            if (product) targetId = product._id;
          }

          if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return "Không tìm thấy sản phẩm để xem đánh giá.";
          }

          const reviews = await Review.find({ product_id: targetId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("rating content createdAt")
            .lean();

          if (!reviews.length) return "Sản phẩm chưa có đánh giá nào.";

          const avgRating = (
            reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
          ).toFixed(1);

          this.metrics.successfulCalls++;
          return {
            average_rating: avgRating,
            total_reviews: reviews.length,
            reviews: reviews.map((r) => ({
              rating: `${r.rating}/5`,
              comment: r.content?.text || "",
              date: new Date(r.createdAt).toLocaleDateString("vi-VN"),
            })),
          };
        }

        case "search_knowledge_base": {
          const parsed = searchKnowledgeBaseArgsSchema.safeParse(rawArgs || {});
          if (!parsed.success) {
            this.metrics.validationFailures++;
            return "Vui lòng nhập nội dung câu hỏi cần tra cứu.";
          }
          const retrieval = await ragService.retrieveContext(
            parsed.data.query,
            {
              sourceTypes: ["page", "settings", "voucher"],
              topK: 4,
            },
            { userId, role: userRole }
          );

          if (!retrieval.chunks.length) {
            return "Chưa tìm thấy thông tin chính sách hoặc hướng dẫn tương ứng trong hệ thống.";
          }

          this.metrics.successfulCalls++;
          return {
            chunks: retrieval.chunks.map((c) => ({
              title: c.title,
              sourceType: c.sourceType,
              content: c.content,
              url: c.url,
              score: c.score,
            })),
            sources: retrieval.sources,
          };
        }

        default: {
          this.metrics.validationFailures++;
          return {
            success: false,
            code: "UNKNOWN_TOOL",
            message: `Tool "${toolName}" không được phép hoặc không tồn tại trong hệ thống.`,
          };
        }
      }
    } catch (error) {
      logger.error(`AiToolRegistry error executing ${toolName}:`, error);
      return {
        success: false,
        code: "TOOL_EXECUTION_ERROR",
        message: `Không thể thực hiện thao tác: ${error.message}`,
      };
    }
  }

  /**
   * High-level natural language intent handler for compound agentic requests
   * e.g., "Tìm cho tôi 3 áo thun dưới 300k và thêm vào giỏ hàng"
   */
  detectCartActionIntent(content = "") {
    const lower = String(content || "").toLowerCase().normalize("NFC");
    const hasCartVerb =
      /(?:thêm|them|bỏ|bo|cho)\s+(?:vào|vao|vô|vo)\s+giỏ(?:\s+hàng)?/i.test(lower) ||
      /add\s+to\s+cart/i.test(lower) ||
      /mua\s+luôn|đặt\s+mua\s+ngay/i.test(lower);
    return hasCartVerb;
  }

  detectConfirmationReply(content = "") {
    const clean = String(content || "").trim().toLowerCase().normalize("NFC");
    const confirmPatterns = [
      /^(?:xác nhận|xac nhan|đồng ý|dong y|ok thêm|oke thêm|thêm đi|them di|thêm vào giỏ|them vao gio|yes|confirm)$/i,
      /^xác nhận thêm vào giỏ hàng$/i,
    ];
    return confirmPatterns.some((p) => p.test(clean));
  }

  detectCancelReply(content = "") {
    const clean = String(content || "").trim().toLowerCase().normalize("NFC");
    return /^(?:hủy|huy|không thêm|khong them|thôi|thoi|cancel)$/i.test(clean);
  }

  generateActionToken(args) {
    return generateActionToken(args);
  }

  verifyActionToken(args) {
    return verifyActionToken(args);
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

const aiToolRegistry = new AiToolRegistry();
export default aiToolRegistry;
