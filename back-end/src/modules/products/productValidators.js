import { z } from 'zod';

// Product schemas
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    name_no_accents: z.string().optional(),
    displayProduct: z.array(z.any()).optional(),
    category_id: z.string().uuid(),
    slug: z.string().min(1),
    description: z.string().optional(),
    old_price: z.number().nonnegative(),
    new_price: z.number().nonnegative(),
    stock: z.number().int().nonnegative().optional(),
    sold: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    is_active: z.boolean().optional(),
    weight: z.number().nonnegative().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    name_no_accents: z.string().optional(),
    displayProduct: z.array(z.any()).optional(),
    category_id: z.string().uuid().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    old_price: z.number().nonnegative().optional(),
    new_price: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    sold: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    is_active: z.boolean().optional(),
    weight: z.number().nonnegative().optional(),
  }),
});

export const searchProductSchema = z.object({
  query: z.object({
    keyword: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createVariantSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
    color: z.string().min(1),
    size: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    image_url: z.string().url(),
  }),
});

export const updateVariantSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    color: z.string().optional(),
    size: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    image_url: z.string().url().optional(),
  }),
});
