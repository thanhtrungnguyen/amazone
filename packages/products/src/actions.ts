"use server";

import { db, products } from "@amazone/db";
import { eq, and, gte, lte, ilike, desc, asc, gt, lt, count } from "drizzle-orm";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilterInput,
} from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createProduct(
  sellerId: string,
  input: CreateProductInput
): Promise<typeof products.$inferSelect> {
  const validated = createProductSchema.parse(input);
  const slug = generateSlug(validated.name) + "-" + Date.now();

  const [product] = await db
    .insert(products)
    .values({
      ...validated,
      sellerId,
      slug,
    })
    .returning();

  return product;
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  input: UpdateProductInput
): Promise<typeof products.$inferSelect | undefined> {
  const validated = updateProductSchema.parse(input);

  const [product] = await db
    .update(products)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
    .returning();

  return product;
}

export async function getProduct(
  productId: string
): Promise<typeof products.$inferSelect | undefined> {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      category: true,
      seller: { columns: { id: true, name: true, image: true } },
    },
  });
}

export async function getProductBySlug(
  slug: string
): Promise<typeof products.$inferSelect | undefined> {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      seller: { columns: { id: true, name: true, image: true } },
    },
  });
}

export async function listProducts(
  input: ProductFilterInput
): Promise<(typeof products.$inferSelect)[]> {
  const filters = productFilterSchema.parse(input);
  const conditions = [];

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice));
  }
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }

  // Cursor-based pagination
  if (filters.cursor) {
    if (filters.sortBy === "price_asc") {
      conditions.push(gt(products.id, filters.cursor));
    } else {
      conditions.push(lt(products.id, filters.cursor));
    }
  }

  const orderBy = {
    price_asc: asc(products.price),
    price_desc: desc(products.price),
    newest: desc(products.createdAt),
    rating: desc(products.avgRating),
    name: asc(products.name),
  }[filters.sortBy];

  return db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy,
    limit: filters.limit,
    with: {
      category: true,
    },
  });
}

export async function countProducts(
  input: Omit<ProductFilterInput, "cursor" | "limit" | "sortBy">
): Promise<number> {
  const filters = productFilterSchema
    .omit({ cursor: true, limit: true, sortBy: true })
    .parse(input);
  const conditions = [];

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice));
  }
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }

  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result?.count ?? 0;
}

export async function deleteProduct(
  productId: string,
  sellerId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
    .returning({ id: products.id });

  return !!deleted;
}
