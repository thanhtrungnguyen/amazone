"use server";

import {
  db,
  products,
  categories,
  users,
  orderItems,
  orders,
  productVariantOptions,
  productVariantValues,
  productVariants,
  productVariantCombinations,
} from "@amazone/db";
import {
  eq,
  and,
  ne,
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
import { alias } from "drizzle-orm/pg-core";
import { createLogger } from "@amazone/shared-utils";
import { cached, invalidateCache } from "@amazone/shared-utils/server";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilterInput,
  type PaginatedProductsResult,
  type PaginatedProductsInput,
  type RelatedProduct,
  LOW_STOCK_THRESHOLD,
  type LowStockProduct,
  type SendEmailFn,
  type RecommendedProduct,
  type ProductVariantsData,
  type CreateProductVariantInput,
  type CreateVariantOptionInput,
  buildLowStockEmailHtml,
} from "./types";

const logger = createLogger("products");

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
  if (filters.minRating !== undefined) {
    conditions.push(gte(products.avgRating, filters.minRating));
  }
  if (filters.inStock === true) {
    conditions.push(gt(products.stock, 0));
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
    featured: desc(products.isFeatured),
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

// ─── Paginated product listing ────────────────────────────────────────────────

/**
 * Fetch a page of products for cursor-based infinite scroll.
 *
 * - `cursor` is the last product ID from the previous page.
 * - `limit` defaults to 24. The function fetches limit + 1 rows so it can
 *   determine whether a next page exists without a separate COUNT query.
 * - `total` is fetched in parallel with the product rows.
 * - Returns `nextCursor: null` when the caller has reached the last page.
 */
export async function getProductsPaginated(
  input: PaginatedProductsInput
): Promise<PaginatedProductsResult> {
  const {
    cursor,
    limit = 24,
    search,
    categoryId,
    sortBy = "featured",
    minPrice,
    maxPrice,
    minRating,
    inStock,
    isActive,
  } = input;

  const conditions: SQL[] = [];

  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (minPrice !== undefined) conditions.push(gte(products.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(products.price, maxPrice));
  if (search) conditions.push(buildSearchCondition(search));
  if (minRating !== undefined) conditions.push(gte(products.avgRating, minRating));
  if (inStock === true) conditions.push(gt(products.stock, 0));
  if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));

  // Cursor condition — direction depends on sort order.
  // For ascending sorts we page forward with gt; for all others with lt.
  if (cursor) {
    if (sortBy === "price_asc") {
      conditions.push(gt(products.id, cursor));
    } else {
      conditions.push(lt(products.id, cursor));
    }
  }

  const orderBy = search
    ? desc(buildSearchRank(search))
    : ({
        price_asc: asc(products.price),
        price_desc: desc(products.price),
        newest: desc(products.createdAt),
        rating: desc(products.avgRating),
        name: asc(products.name),
        featured: desc(products.isFeatured),
      }[sortBy] ?? desc(products.isFeatured));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch limit+1 rows to detect whether a next page exists, and total count
  // in parallel so we only need one round-trip to the DB.
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit + 1),
    db
      .select({ count: count() })
      .from(products)
      .where(
        // Total count uses the filter conditions only — no cursor.
        (() => {
          const countConditions: SQL[] = [];
          if (categoryId) countConditions.push(eq(products.categoryId, categoryId));
          if (minPrice !== undefined) countConditions.push(gte(products.price, minPrice));
          if (maxPrice !== undefined) countConditions.push(lte(products.price, maxPrice));
          if (search) countConditions.push(buildSearchCondition(search));
          if (minRating !== undefined)
            countConditions.push(gte(products.avgRating, minRating));
          if (inStock === true) countConditions.push(gt(products.stock, 0));
          if (isActive !== undefined) countConditions.push(eq(products.isActive, isActive));
          return countConditions.length > 0 ? and(...countConditions) : undefined;
        })()
      ),
  ]);

  const hasNextPage = rows.length > limit;
  const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage ? (pageRows[pageRows.length - 1]?.id ?? null) : null;

  return {
    products: pageRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      images: row.images as string[] | null,
      stock: row.stock,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      avgRating: row.avgRating,
      reviewCount: row.reviewCount,
      categoryId: row.categoryId,
    })),
    nextCursor,
    total: countResult[0]?.count ?? 0,
  };
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
  if (filters.minRating !== undefined) {
    conditions.push(gte(products.avgRating, filters.minRating));
  }
  if (filters.inStock === true) {
    conditions.push(gt(products.stock, 0));
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

export async function getRelatedProducts(
  productId: string,
  limit: number = 4
): Promise<RelatedProduct[]> {
  return cached(
    `related:${productId}`,
    async () => {
      try {
        // 1. Get the product's categoryId
        const product = await db.query.products.findFirst({
          where: eq(products.id, productId),
          columns: { categoryId: true },
        });

        let results: RelatedProduct[] = [];

        // 2. Find other active products in the same category
        if (product?.categoryId) {
          results = await db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              price: products.price,
              compareAtPrice: products.compareAtPrice,
              images: products.images,
              avgRating: products.avgRating,
              reviewCount: products.reviewCount,
            })
            .from(products)
            .where(
              and(
                eq(products.categoryId, product.categoryId),
                ne(products.id, productId),
                eq(products.isActive, true)
              )
            )
            .orderBy(desc(products.isFeatured), desc(products.avgRating))
            .limit(limit);
        }

        // 5. Fallback to featured products if no category or no results
        if (results.length === 0) {
          results = await db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              price: products.price,
              compareAtPrice: products.compareAtPrice,
              images: products.images,
              avgRating: products.avgRating,
              reviewCount: products.reviewCount,
            })
            .from(products)
            .where(
              and(
                ne(products.id, productId),
                eq(products.isActive, true),
                eq(products.isFeatured, true)
              )
            )
            .orderBy(desc(products.avgRating))
            .limit(limit);
        }

        return results;
      } catch (error) {
        logger.error({ err: error, productId }, "Failed to fetch related products");
        return [];
      }
    },
    { ttl: 300 }
  );
}

// ─── Low-Stock Alerts ────────────────────────────────────────────────────────

/**
 * Return all active products owned by `sellerId` whose stock is at or below
 * LOW_STOCK_THRESHOLD.  Results are ordered from lowest stock first so
 * out-of-stock items surface at the top.
 */
export async function getLowStockProducts(
  sellerId: string
): Promise<{ success: true; data: LowStockProduct[] } | { success: false; error: string }> {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        stock: products.stock,
        sellerId: products.sellerId,
      })
      .from(products)
      .where(
        and(
          eq(products.sellerId, sellerId),
          lte(products.stock, LOW_STOCK_THRESHOLD),
          eq(products.isActive, true)
        )
      )
      .orderBy(asc(products.stock), asc(products.name));

    return { success: true, data: rows };
  } catch (error) {
    logger.error({ err: error, sellerId }, "getLowStockProducts: DB error");
    return { success: false, error: "errors.low_stock.fetch_failed" };
  }
}

interface SellerLowStockGroup {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  items: LowStockProduct[];
}

/**
 * Query every active product with stock <= LOW_STOCK_THRESHOLD, group them by
 * seller, build an HTML email per seller, and dispatch via the injected
 * `sendEmail` callback.
 *
 * The callback injection keeps this package decoupled from apps/web's nodemailer
 * transport (packages must NOT import from apps/*).
 *
 * Pass `sellerIdFilter` to restrict to a single seller — used by the
 * "Send Alert" button on the seller dashboard.
 *
 * Never throws.  Returns a { sent, failed } summary.
 */
export async function sendLowStockAlertEmails(params: {
  sendEmail: SendEmailFn;
  sellerIdFilter?: string;
}): Promise<
  | { success: true; data: { sent: number; failed: number } }
  | { success: false; error: string }
> {
  try {
    const baseConditions = [
      lte(products.stock, LOW_STOCK_THRESHOLD),
      eq(products.isActive, true),
    ];

    if (params.sellerIdFilter) {
      baseConditions.push(eq(products.sellerId, params.sellerIdFilter));
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        stock: products.stock,
        sellerId: products.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(and(...baseConditions))
      .orderBy(asc(products.stock), asc(products.name));

    if (rows.length === 0) {
      return { success: true, data: { sent: 0, failed: 0 } };
    }

    // Group by seller
    const sellerMap = new Map<string, SellerLowStockGroup>();
    for (const row of rows) {
      let group = sellerMap.get(row.sellerId);
      if (!group) {
        group = {
          sellerId: row.sellerId,
          sellerName: row.sellerName,
          sellerEmail: row.sellerEmail,
          items: [],
        };
        sellerMap.set(row.sellerId, group);
      }
      group.items.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        stock: row.stock,
        sellerId: row.sellerId,
      });
    }

    const results = await Promise.allSettled(
      Array.from(sellerMap.values()).map(async (group) => {
        const html = buildLowStockEmailHtml({
          sellerName: group.sellerName,
          items: group.items,
        });

        await params.sendEmail({
          to: group.sellerEmail,
          subject: `Low Stock Alert — ${group.items.length} product${group.items.length !== 1 ? "s" : ""} need attention`,
          html,
        });

        logger.info(
          { sellerId: group.sellerId, itemCount: group.items.length },
          "Low stock alert email sent"
        );
      })
    );

    let sent = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        logger.error(
          { err: result.reason },
          "sendLowStockAlertEmails: failed to send email to seller"
        );
      }
    }

    return { success: true, data: { sent, failed } };
  } catch (error) {
    logger.error({ err: error }, "sendLowStockAlertEmails: unexpected error");
    return { success: false, error: "errors.low_stock.send_failed" };
  }
}

// ─── Product Recommendations ─────────────────────────────────────────────────

/**
 * Products that frequently appear in the same orders as the given product.
 *
 * Performs a self-join on order_items: for every order that contains
 * `productId`, find the other products in that order, grouped and ranked
 * by co-occurrence count.
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 4
): Promise<{ success: true; data: RecommendedProduct[] } | { success: false; error: string }> {
  try {
    // Use Drizzle alias for the self-join on order_items
    const oi1 = orderItems;
    const oi2 = alias(orderItems, "oi2");

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        coCount: count(oi2.id).as("co_count"),
      })
      .from(oi1)
      .innerJoin(oi2, and(eq(oi1.orderId, oi2.orderId), ne(oi1.productId, oi2.productId)))
      .innerJoin(products, eq(oi2.productId, products.id))
      .where(and(eq(oi1.productId, productId), eq(products.isActive, true)))
      .groupBy(
        products.id,
        products.name,
        products.slug,
        products.price,
        products.compareAtPrice,
        products.images,
        products.avgRating,
        products.reviewCount
      )
      .orderBy(sql`co_count DESC`)
      .limit(limit);

    return {
      success: true,
      data: rows.map(({ coCount: _, ...rest }) => rest),
    };
  } catch (error) {
    logger.error({ err: error, productId }, "getFrequentlyBoughtTogether: DB error");
    return { success: false, error: "errors.recommendations.fetch_failed" };
  }
}

/**
 * Top products in a category ranked by review count + average rating.
 *
 * Uses a composite score: `reviewCount * 1000 + avgRating` so that products
 * with many reviews rank first, with ties broken by rating.
 */
export async function getPopularInCategory(
  categoryId: string,
  limit: number = 6
): Promise<{ success: true; data: RecommendedProduct[] } | { success: false; error: string }> {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
      })
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.isActive, true)
        )
      )
      .orderBy(
        desc(sql`${products.reviewCount} * 1000 + ${products.avgRating}`)
      )
      .limit(limit);

    return { success: true, data: rows };
  } catch (error) {
    logger.error({ err: error, categoryId }, "getPopularInCategory: DB error");
    return { success: false, error: "errors.recommendations.fetch_failed" };
  }
}

/**
 * Products with the most orders in the last 30 days.
 *
 * Joins order_items -> orders, filters orders by created_at >= 30 days ago,
 * groups by product, and orders by total quantity sold descending.
 */
export async function getTrendingProducts(
  limit: number = 6
): Promise<{ success: true; data: RecommendedProduct[] } | { success: false; error: string }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        totalSold: sql<number>`cast(sum(${orderItems.quantity}) as int)`.as("total_sold"),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          gte(orders.createdAt, thirtyDaysAgo),
          eq(products.isActive, true)
        )
      )
      .groupBy(
        products.id,
        products.name,
        products.slug,
        products.price,
        products.compareAtPrice,
        products.images,
        products.avgRating,
        products.reviewCount
      )
      .orderBy(sql`total_sold DESC`)
      .limit(limit);

    return {
      success: true,
      data: rows.map(({ totalSold: _, ...rest }) => rest),
    };
  } catch (error) {
    logger.error({ err: error }, "getTrendingProducts: DB error");
    return { success: false, error: "errors.recommendations.fetch_failed" };
  }
}

/**
 * Get a random active category that has at least one active product.
 * Used by the home page to display "Popular in [Category]".
 */
export async function getRandomActiveCategory(): Promise<
  { success: true; data: { id: string; name: string; slug: string } } | { success: false; error: string }
> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .innerJoin(products, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(sql`random()`)
      .limit(1);

    if (rows.length === 0) {
      return { success: false, error: "errors.recommendations.no_categories" };
    }

    return { success: true, data: rows[0] };
  } catch (error) {
    logger.error({ err: error }, "getRandomActiveCategory: DB error");
    return { success: false, error: "errors.recommendations.fetch_failed" };
  }
}

// ─── Product Variants ─────────────────────────────────────────────────────────

/**
 * Fetch all variant options, values, and variant combinations for a product.
 * Returns structured data for the variant selector UI.
 */
export async function getProductVariants(
  productId: string
): Promise<ProductVariantsData> {
  // Fetch options with values using Drizzle relations
  const options = await db.query.productVariantOptions.findMany({
    where: eq(productVariantOptions.productId, productId),
    orderBy: asc(productVariantOptions.position),
    with: {
      values: {
        orderBy: asc(productVariantValues.position),
      },
    },
  });

  // Fetch variants with their combinations
  const variants = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, productId),
    with: {
      combinations: true,
    },
  });

  return {
    options: options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      position: opt.position,
      values: opt.values.map((val) => ({
        id: val.id,
        value: val.value,
        position: val.position,
      })),
    })),
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      priceInCents: v.priceInCents,
      stock: v.stock,
      isActive: v.isActive,
      combinations: v.combinations.map((c) => ({
        optionId: c.optionId,
        valueId: c.valueId,
      })),
    })),
  };
}

/**
 * Create a product variant with its option-value combinations.
 * Used by sellers to define specific variants (e.g. "Large Red" with custom price/stock).
 */
export async function createProductVariant(
  productId: string,
  input: CreateProductVariantInput
): Promise<
  { success: true; data: { variantId: string } } | { success: false; error: string }
> {
  try {
    if (input.combinations.length === 0) {
      return { success: false, error: "At least one option-value combination is required" };
    }

    // Insert the variant row
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: input.sku ?? null,
        priceInCents: input.priceInCents ?? null,
        stock: input.stock ?? 0,
      })
      .returning();

    // Insert all combination rows
    await db.insert(productVariantCombinations).values(
      input.combinations.map((combo) => ({
        variantId: variant.id,
        optionId: combo.optionId,
        valueId: combo.valueId,
      }))
    );

    return { success: true, data: { variantId: variant.id } };
  } catch (error) {
    logger.error({ err: error, productId }, "createProductVariant: DB error");
    return { success: false, error: "Failed to create product variant" };
  }
}

/**
 * Create a variant option (e.g. "Size") with its values (e.g. "S", "M", "L").
 * Returns the option ID and value IDs for use in variant combination creation.
 */
export async function createVariantOption(
  productId: string,
  input: CreateVariantOptionInput
): Promise<
  | { success: true; data: { optionId: string; valueIds: string[] } }
  | { success: false; error: string }
> {
  try {
    const [option] = await db
      .insert(productVariantOptions)
      .values({
        productId,
        name: input.name,
        position: input.position ?? 0,
      })
      .returning();

    const values = await db
      .insert(productVariantValues)
      .values(
        input.values.map((v, idx) => ({
          optionId: option.id,
          value: v.value,
          position: v.position ?? idx,
        }))
      )
      .returning();

    return {
      success: true,
      data: {
        optionId: option.id,
        valueIds: values.map((v) => v.id),
      },
    };
  } catch (error) {
    logger.error({ err: error, productId }, "createVariantOption: DB error");
    return { success: false, error: "Failed to create variant option" };
  }
}
