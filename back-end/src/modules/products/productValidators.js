import { z } from "zod";
import { zodObjectId } from "../../common/utils/schemas.js";

// Sub-schema for variants inside create/update product requests
const productVariantInputSchema = z.object({
  color: z.string().min(1, "Màu sắc biến thể không được để trống"),
  size: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  image_url: z.string().optional(),
});

// Product schemas
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    name_no_accents: z.string().optional(),
    displayProduct: z.array(z.any()).optional(),
    category_id: zodObjectId,
    slug: z.string().optional(),
    description: z.string().optional(),
    old_price: z.number().nonnegative(),
    new_price: z.number().nonnegative(),
    stock: z.number().int().nonnegative().optional(),
    sold: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    is_active: z.boolean().optional(),
    weight: z.number().nonnegative().optional(),
    variants: z.array(productVariantInputSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: zodObjectId,
  }),
  body: z.object({
    name: z.string().optional(),
    name_no_accents: z.string().optional(),
    displayProduct: z.array(z.any()).optional(),
    category_id: zodObjectId.optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    old_price: z.number().nonnegative().optional(),
    new_price: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    sold: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    is_active: z.boolean().optional(),
    weight: z.number().nonnegative().optional(),
    variants: z.array(productVariantInputSchema).optional(),
  }),
});

export const searchProductSchema = z.object({
  query: z.object({
    keyword: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
});

export const createVariantSchema = z.object({
  body: z.object({
    product_id: zodObjectId,
    color: z.string().min(1),
    size: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    image_url: z.string().min(1),
  }),
});

export const updateVariantSchema = z.object({
  params: z.object({
    id: zodObjectId,
  }),
  body: z.object({
    color: z.string().optional(),
    size: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    image_url: z.string().optional(),
  }),
});
