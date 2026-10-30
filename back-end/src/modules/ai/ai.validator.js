import { z } from "zod";
import { AppError } from "../../common/exceptions/AppError.js";

const validSourceTypes = z.enum([
  "product",
  "page",
  "voucher",
  "category",
  "faq",
  "policy",
  "settings",
]);

export const aiSearchSchema = z.object({
  query: z.string().trim().min(1, "Vui lòng nhập từ khóa hoặc câu tìm kiếm (query)").max(500),
  sourceType: z.union([validSourceTypes, z.array(validSourceTypes)]).optional(),
  topK: z.coerce.number().int().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  minScore: z.coerce.number().min(0).max(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().max(200).optional(),
  categorySlug: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  inStock: z.preprocess(
    (v) => (v === "true" ? true : v === "false" ? false : v),
    z.boolean().optional()
  ),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

export const aiChatSchema = z
  .object({
    content: z.string().trim().max(5000).optional(),
    message: z.string().trim().max(5000).optional(),
    question: z.string().trim().max(5000).optional(),
    mode: z.enum(["agent", "rag"]).optional().default("agent"),
    conversationId: z.any().optional(),
    currentProductId: z.any().optional(),
    metadata: z.record(z.string(), z.any()).optional().default({}),
    history: z.array(z.any()).optional(),
    confirmAction: z.any().optional(),
    cancelAction: z.any().optional(),
  })
  .refine((d) => Boolean(d.content || d.message || d.question || d.confirmAction || d.cancelAction), {
    message: "Vui lòng nhập nội dung tin nhắn (content/message/question)",
    path: ["content"],
  })
  .transform((d) => ({
    ...d,
    content: d.content || d.message || d.question || (d.confirmAction ? "Xác nhận" : "Hủy"),
  }));

export const aiSyncSchema = z.object({
  types: z
    .array(z.enum(["product", "page", "voucher", "settings"]))
    .min(1)
    .optional()
    .default(["product", "page", "voucher", "settings"]),
  force: z.boolean().optional().default(false),
  batchSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  background: z.boolean().optional().default(false),
  sourceType: z.enum(["product", "page"]).optional(),
  sourceId: z.string().optional(),
});

export const validateAiRequest = (schema, source = "body") => (req, _res, next) => {
  const input =
    source === "auto"
      ? req.method === "GET"
        ? req.query
        : { ...req.query, ...req.body }
      : req[source];

  const parsed = schema.safeParse(input || {});
  if (!parsed.success) {
    const messages = (parsed.error?.issues || []).map((i) => {
      const pathStr = i.path?.length ? `${i.path.join(".")}: ` : "";
      return `${pathStr}${i.message}`;
    });
    const err = new AppError(messages.join("; ") || "Dữ liệu đầu vào không hợp lệ", 400);
    err.details = messages;
    return next(err);
  }

  req.validatedAiData = parsed.data;
  return next();
};
