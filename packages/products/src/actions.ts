"use server";

import { db, products, categories } from "@amazone/db";
import {
  eq,
  and,
  or,
  gte,
  lte,
  ilike,
  desc,
  asc,
  gt,
  lt,
  count,
  sql,
  type SQL,
} from "drizzle-orm";
import { cached, invalidateCache } from "@amazone/shared-utils";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilterInput,
} from "./types";

/**
 * Build a full-text search condition that combines tsvector matching
 * with an ilike fallback for partial word matches.
 */
function buildSearchCondition(search: string): SQL {
  const tsVector = sql`to_tsvector('english', ${products.name} || ' ' || coalesce(${products.description}, ''))`;
  const tsQuery = sql`plainto_tsquery('english', ${search})`;
  const ftsMatch = sql`${tsVector} @@ ${tsQuery}`;
  return or(
    sql`${ftsMatch}`,
    ilike(products.name, `%${search}%`),
    ilike(products.description, `%${search}%`)
  )!;
}

/**
 * Build a ts_rank expression for relevance ordering.
 */
function buildSearchRank(search: string): SQL {
  const tsVector = sql`to_tsvector('english', ${products.name} || ' ' || coalesce(${products.description}, ''))`;
  const tsQuery = sql`plainto_tsquery('english', ${search})`;
  return sql`ts_rank(${tsVector}, ${tsQuery})`;
}

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

  await invalidateCache("product:slug:*", "categories:*");
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

  if (product) {
    await invalidateCache(`product:slug:${product.slug}`, "categories:*");
  }
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
  return cached(
    `product:slug:${slug}`,
    () =>
      db.query.products.findFirst({
        where: eq(products.slug, slug),
        with: {
          category: true,
          seller: { columns: { id: true, name: true, image: true } },
        },
      }),
    { ttl: 300 }
  );
}

export async function listProducts(
  input: ProductFilterInput
): Promise<(typeof products.$inferSelect)[]> {
  const filters = productFilterSchema.parse(input);
  const conditions: SQL[] = [];

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
    conditions.push(buildSearchCondition(filters.search));
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

  // When search is active, use ts_rank for relevance ordering by default.
  // Otherwise, use the requested sort order.
  if (filters.search) {
    const rankExpr = buildSearchRank(filters.search);

    // Use db.select() so we can inject ts_rank ordering.
    // Left join categories to match the previous `with: { category: true }` behavior.
    const rows = await db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rankExpr))
      .limit(filters.limit);

    return rows.map((row) => ({
      ...row.product,
      category: row.category,
    })) as (typeof products.$inferSelect)[];
  }

  // Non-search path: keep the original relational query for simplicity
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
    conditions.push(buildSearchCondition(filters.search));
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
    .returning({ id: products.id, slug: products.slug });

  if (deleted) {
    await invalidateCache(`product:slug:${deleted.slug}`, "categories:*");
  }
  return !!deleted;
}
