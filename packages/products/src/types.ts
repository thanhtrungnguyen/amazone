import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  price: z.number().int().positive(), // in cents
  compareAtPrice: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "rating", "name"])
    .default("newest"),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
