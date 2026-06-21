/**
 * Banner validators — Zod schema-based.
 * Giữ nguyên tên export để không break banner.route.js.
 *
 * Đặc biệt xử lý:
 *  - sortOrder: coerce string → number
 *  - startDate/endDate: coerce string → Date + so sánh start < end
 *  - isActive: coerce string "true"/"false" → boolean
 *  - targetId: required khi targetType là "product" | "category" | "lookbook"
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";

// ---------------------------------------------------------------------------
// targetType enum
// ---------------------------------------------------------------------------

const targetTypeEnum = z.enum(["product", "category", "external", "lookbook"], {
  message: "Kiểu liên kết (targetType) không hợp lệ",
});

// ---------------------------------------------------------------------------
// Coerced date — chấp nhận string ISO hoặc Date object
// ---------------------------------------------------------------------------

const zodDate = z.coerce
  .date({ invalid_type_error: "Ngày không đúng định dạng" });

// ---------------------------------------------------------------------------
// Boolean coercion — chấp nhận true/false/\"true\"/\"false\"
// ---------------------------------------------------------------------------

const zodBoolCoerce = z.preprocess(
  (val) => {
    if (typeof val === "string") return val === "true";
    return val;
  },
  z.boolean()
);

// ---------------------------------------------------------------------------
// Schema gốc cho create banner (tất cả required fields)
// ---------------------------------------------------------------------------

const createBannerBaseSchema = z.object({
  title:      z.string({ required_error: "Tiêu đề (title) không được để trống" }).trim().min(1, "Tiêu đề (title) không được để trống"),
  imageUrl:   z.string({ required_error: "Đường dẫn hình ảnh (imageUrl) không được để trống" }).trim().min(1, "Đường dẫn hình ảnh (imageUrl) không được để trống"),
  position:   z.string({ required_error: "Vị trí hiển thị (position) không được để trống" }).trim().min(1, "Vị trí hiển thị (position) không được để trống"),
  sortOrder:  z.coerce.number({ invalid_type_error: "Thứ tự hiển thị (sortOrder) phải là số" }).min(0, "Thứ tự hiển thị (sortOrder) phải là số lớn hơn hoặc bằng 0").optional(),
  startDate:  zodDate,
  endDate:    zodDate,
  targetType: targetTypeEnum.default("external"),
  targetId:   z.string().trim().optional(),
  isActive:   zodBoolCoerce.optional(),
  link:       z.string().trim().optional(),
  description: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  // 1. Kiểm tra startDate < endDate
  if (data.startDate && data.endDate && data.startDate >= data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
    });
  }

  // 2. targetId bắt buộc khi targetType yêu cầu
  const requiresTargetId = ["product", "category", "lookbook"];
  if (requiresTargetId.includes(data.targetType) && (!data.targetId || data.targetId.trim() === "")) {
    const labels = {
      product:  "Mã sản phẩm liên kết (targetId) là bắt buộc khi targetType là product",
      category: "Mã danh mục liên kết (targetId) là bắt buộc khi targetType là category",
      lookbook: "Slug / ID của Lookbook liên kết (targetId) là bắt buộc khi targetType là lookbook",
    };
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetId"],
      message: labels[data.targetType],
    });
  }
});

// ---------------------------------------------------------------------------
// Schema cho update banner (tất cả optional, nhưng nếu có date thì phải hợp lệ)
// ---------------------------------------------------------------------------

const updateBannerBaseSchema = z.object({
  title:      z.string().trim().min(1, "Tiêu đề (title) không được để trống").optional(),
  imageUrl:   z.string().trim().min(1, "Đường dẫn hình ảnh (imageUrl) không được để trống").optional(),
  position:   z.string().trim().min(1, "Vị trí hiển thị (position) không được để trống").optional(),
  sortOrder:  z.coerce.number().min(0, "Thứ tự hiển thị (sortOrder) phải là số lớn hơn hoặc bằng 0").optional(),
  startDate:  zodDate.optional(),
  endDate:    zodDate.optional(),
  targetType: targetTypeEnum.optional(),
  targetId:   z.string().trim().optional(),
  isActive:   zodBoolCoerce.optional(),
  link:       z.string().trim().optional(),
  description: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  // Kiểm tra start < end chỉ khi cả hai đều được cung cấp
  if (data.startDate && data.endDate && data.startDate >= data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
    });
  }
});

// ---------------------------------------------------------------------------
// Middleware exports — tên giữ nguyên, backward compatible với banner.route.js
// ---------------------------------------------------------------------------

export const validateCreateBanner = validate(createBannerBaseSchema);
export const validateUpdateBanner = validate(updateBannerBaseSchema);
