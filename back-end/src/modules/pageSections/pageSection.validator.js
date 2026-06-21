/**
 * PageSection validators — Zod schema-based, utility function style.
 * KHÔNG phải Express middleware — được gọi từ service layer.
 * Giữ nguyên tên export để không break pageSection.service.js.
 *
 * Khi validation fail → throw AppError (không gọi next()).
 */
import { z } from "zod";
import { AppError } from "../../common/exceptions/AppError.js";

// ---------------------------------------------------------------------------
// Section data schemas (dùng lại schema từ page.validator, nhưng định nghĩa
// độc lập để tránh coupling giữa modules)
// ---------------------------------------------------------------------------

const sectionDataSchemas = {
  hero: z.object({
    title:       z.string().optional(),
    subtitle:    z.string().optional(),
    description: z.string().optional(),
    coverImage:  z.string().optional(),
    buttonText:  z.string().optional(),
    buttonLink:  z.string().optional(),
  }).passthrough(),

  story: z.object({
    heading: z.string().optional(),
    content: z.string().optional(),
  }).passthrough(),

  gallery: z.object({
    images: z
      .array(
        z.object({
          imageUrl: z.string({ required_error: "Gallery image yêu cầu imageUrl là chuỗi" }),
          caption:  z.string().optional(),
        }).passthrough()
      )
      .optional(),
  }).passthrough(),

  quote: z.object({
    quote:  z.string({ required_error: "Quote text là bắt buộc và phải là chuỗi" }).min(1, "Quote text là bắt buộc và phải là chuỗi"),
    author: z.string().optional(),
  }).passthrough(),

  image_text: z.object({
    image:         z.string().optional(),
    title:         z.string().optional(),
    content:       z.string().optional(),
    imagePosition: z.enum(["left", "right"], { message: "Image + Text imagePosition phải là 'left' hoặc 'right'" }).optional(),
  }).passthrough(),

  products: z.object({
    productIds: z.array(z.string(), { required_error: "Products spotlight productIds phải là một mảng" }),
  }).passthrough(),

  banner: z.object({
    image:      z.string().optional(),
    title:      z.string().optional(),
    subtitle:   z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
  }).passthrough(),

  cta: z.object({
    title:       z.string().optional(),
    description: z.string().optional(),
    buttonText:  z.string().optional(),
    buttonLink:  z.string().optional(),
  }).passthrough(),
};

const validSectionTypes = Object.keys(sectionDataSchemas);

// ---------------------------------------------------------------------------
// Utility exports — tên giữ nguyên, backward compatible với service layer
// ---------------------------------------------------------------------------

/**
 * Validate dữ liệu của một section theo type.
 * Throw AppError nếu validation fail.
 *
 * @param {string} type
 * @param {object} data
 */
export const validateSectionData = (type, data) => {
  const schema = sectionDataSchemas[type];
  if (!schema) {
    throw new AppError(`Loại khối nội dung không hợp lệ: ${type}`, 400);
  }

  const result = schema.safeParse(data || {});
  if (!result.success) {
    const messages = result.error.errors.map((e) => {
      const field = e.path.length > 0 ? e.path.join(".") + ": " : "";
      return `${field}${e.message}`;
    });
    throw new AppError(`Dữ liệu khối ${type} không hợp lệ: ${messages.join(". ")}`, 400);
  }
};

/**
 * Validate toàn bộ mảng sections.
 * Throw AppError nếu validation fail.
 *
 * @param {any[]} sections
 */
export const validateSectionsArray = (sections) => {
  if (!sections) return;

  if (!Array.isArray(sections)) {
    throw new AppError("Bố cục các khối (sections) phải là một mảng", 400);
  }

  sections.forEach((sec, index) => {
    if (!sec.type) {
      throw new AppError(`Khối nội dung thứ ${index} thiếu loại (type)`, 400);
    }
    validateSectionData(sec.type, sec.data);
  });
};

/**
 * Trả về danh sách các section type hợp lệ (dùng cho documentation / seeding).
 */
export const getValidSectionTypes = () => validSectionTypes;
