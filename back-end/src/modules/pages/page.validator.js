/**
 * Page validators — Zod schema-based.
 * Giữ nguyên tên export để không break page.route.js.
 *
 * Sử dụng z.discriminatedUnion() cho polymorphic section types thay vì
 * SectionValidator object thủ công.
 */
import { z } from "zod";
import { validate } from "../../common/utils/validate.js";

// ---------------------------------------------------------------------------
// Section data schemas theo từng type
// ---------------------------------------------------------------------------

const heroDataSchema = z.object({
  title:       z.string().optional(),
  subtitle:    z.string().optional(),
  description: z.string().optional(),
  coverImage:  z.string().optional(),
  buttonText:  z.string().optional(),
  buttonLink:  z.string().optional(),
}).passthrough();

const storyDataSchema = z.object({
  heading: z.string().optional(),
  content: z.string().optional(),
}).passthrough();

const galleryImageSchema = z.object({
  imageUrl: z.string({ required_error: "Gallery image yêu cầu imageUrl là chuỗi" }),
  caption:  z.string().optional(),
}).passthrough();

const galleryDataSchema = z.object({
  images: z.array(galleryImageSchema).optional(),
}).passthrough();

const quoteDataSchema = z.object({
  quote:  z.string({ required_error: "Quote text là bắt buộc và phải là chuỗi" }).min(1, "Quote text là bắt buộc và phải là chuỗi"),
  author: z.string().optional(),
}).passthrough();

const imageTextDataSchema = z.object({
  image:         z.string().optional(),
  title:         z.string().optional(),
  content:       z.string().optional(),
  imagePosition: z.enum(["left", "right"], { message: "Image + Text imagePosition phải là 'left' hoặc 'right'" }).optional(),
}).passthrough();

const productsDataSchema = z.object({
  productIds: z.array(z.string(), { required_error: "Products spotlight productIds phải là một mảng" }),
}).passthrough();

const bannerDataSchema = z.object({
  image:      z.string().optional(),
  title:      z.string().optional(),
  subtitle:   z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
}).passthrough();

const ctaDataSchema = z.object({
  title:       z.string().optional(),
  description: z.string().optional(),
  buttonText:  z.string().optional(),
  buttonLink:  z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Section item schema — discriminated union trên field "type"
// ---------------------------------------------------------------------------

const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"),       data: heroDataSchema.optional(),       sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("story"),      data: storyDataSchema.optional(),      sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("gallery"),    data: galleryDataSchema.optional(),    sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("quote"),      data: quoteDataSchema.optional(),      sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("image_text"), data: imageTextDataSchema.optional(),  sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("products"),   data: productsDataSchema.optional(),   sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("banner"),     data: bannerDataSchema.optional(),     sortOrder: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("cta"),        data: ctaDataSchema.optional(),        sortOrder: z.number().optional() }).passthrough(),
]);

// ---------------------------------------------------------------------------
// Page schema
// ---------------------------------------------------------------------------

const validTypes    = ["about", "policy", "faq", "guide", "lookbook", "landing", "blog"];
const validStatuses = ["draft", "published", "archived"];

const pageSchema = z.object({
  title:           z.string({ required_error: "Tiêu đề (title) không được để trống" }).trim().min(1, "Tiêu đề (title) không được để trống"),
  slug:            z.string({ required_error: "Slug không được để trống" }).trim().min(1, "Slug không được để trống"),
  type:            z.enum(validTypes, {
                     required_error: "Loại trang (type) không được để trống",
                     message: `Loại trang (type) phải thuộc một trong các giá trị: ${validTypes.join(", ")}`,
                   }),
  status:          z.enum(validStatuses, {
                     message: `Trạng thái (status) phải thuộc một trong các giá trị: ${validStatuses.join(", ")}`,
                   }).optional(),
  sections:        z.array(sectionSchema, { invalid_type_error: "Bố cục các khối (sections) phải là một mảng" }).optional(),
  relatedProducts: z.array(z.string()).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Pre-processing: hỗ trợ body có dạng { page: {...}, sections: [...] }
// (tương thích với transform đang có trong handler cũ)
// ---------------------------------------------------------------------------

const pageSchemaWithPreprocess = z.preprocess((input) => {
  if (input && typeof input === "object" && input.page) {
    return {
      ...input.page,
      sections: input.sections || input.page.sections || [],
    };
  }
  return input;
}, pageSchema);

// ---------------------------------------------------------------------------
// Middleware export — tên giữ nguyên, backward compatible với page.route.js
// ---------------------------------------------------------------------------

export const validatePage = validate(pageSchemaWithPreprocess);
