import { z } from "zod";
import { validate } from "../../common/utils/validate.js";

export const createCampaignSchema = z
  .object({
    name: z.string({ required_error: "Tên chiến dịch là bắt buộc" }).min(1, "Tên chiến dịch không được để trống").trim(),
    slug: z
      .string({ required_error: "Slug là bắt buộc" })
      .min(1, "Slug không được để trống")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang")
      .trim(),
    type: z.enum(["flash_sale", "seasonal"], {
      required_error: "Loại chiến dịch bắt buộc: flash_sale hoặc seasonal",
    }),
    status: z.enum(["draft", "scheduled", "active", "ended"]).default("draft"),
    startAt: z.string({ required_error: "Thời gian bắt đầu là bắt buộc" }),
    endAt: z.string({ required_error: "Thời gian kết thúc là bắt buộc" }),
    priority: z.number().int().default(0),
    bannerId: z.string().nullable().optional(),
    pageId: z.string().nullable().optional(),
    discountRule: z
      .object({
        scope: z.enum(["all", "categories", "products"]).default("all"),
        categoryIds: z.array(z.string()).default([]),
        discountType: z.enum(["percentage", "fixed"]).default("percentage"),
        discountValue: z.number().positive("Giá trị giảm giá phải lớn hơn 0"),
        maxDiscountAmount: z.number().nonnegative().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
      message: "Thời gian kết thúc (endAt) phải sau thời gian bắt đầu (startAt)",
      path: ["endAt"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "seasonal") {
        return (
          data.discountRule &&
          data.discountRule.discountValue &&
          data.discountRule.discountValue > 0
        );
      }
      return true;
    },
    {
      message: "Chiến dịch seasonal bắt buộc phải có discountRule hợp lệ",
      path: ["discountRule"],
    }
  );

export const updateCampaignSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    type: z.enum(["flash_sale", "seasonal"]).optional(),
    status: z.enum(["draft", "scheduled", "active", "ended"]).optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    priority: z.number().int().optional(),
    bannerId: z.string().nullable().optional(),
    pageId: z.string().nullable().optional(),
    discountRule: z
      .object({
        scope: z.enum(["all", "categories", "products"]).default("all"),
        categoryIds: z.array(z.string()).default([]),
        discountType: z.enum(["percentage", "fixed"]).default("percentage"),
        discountValue: z.number().positive("Giá trị giảm giá phải lớn hơn 0"),
        maxDiscountAmount: z.number().nonnegative().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .strict();

export const addCampaignProductSchema = z
  .object({
    product_id: z.string({ required_error: "product_id là bắt buộc" }).min(1, "product_id là bắt buộc"),
    variant_id: z.string().nullable().optional(),
    sale_price: z.number({ required_error: "sale_price là bắt buộc" }).positive("sale_price phải lớn hơn 0"),
    quota: z.number({ required_error: "quota là bắt buộc" }).int().positive("quota phải là số nguyên lớn hơn 0"),
    per_user_limit: z.number().int().positive().nullable().optional(),
  })
  .strict();

export const updateCampaignProductSchema = z
  .object({
    sale_price: z.number().positive().optional(),
    quota: z.number().int().positive().optional(),
    per_user_limit: z.number().int().positive().nullable().optional(),
  })
  .strict();

export const validateCreateCampaign = validate(createCampaignSchema);
export const validateUpdateCampaign = validate(updateCampaignSchema);
export const validateAddCampaignProduct = validate(addCampaignProductSchema);
export const validateUpdateCampaignProduct = validate(updateCampaignProductSchema);
