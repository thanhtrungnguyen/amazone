"use server";

import { db, products, categories, users, orderItems, orders } from "@amazone/db";
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
import { cached, invalidateCache, createLogger } from "@amazone/shared-utils";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilterInput,
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

export interface PaginatedProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  categoryId: string | null;
}

export interface PaginatedProductsResult {
  products: PaginatedProductItem[];
  nextCursor: string | null;
  total: number;
}

export interface PaginatedProductsInput {
  cursor?: string;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "rating" | "name" | "featured";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isActive?: boolean;
}

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

export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
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

/** The stock level at or below which a product is considered low. */
export const LOW_STOCK_THRESHOLD = 5;

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  sellerId: string;
}

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

/**
 * Build the HTML body for a low-stock alert email for one seller.
 * Exported so the apps/web email utility can call it when constructing the
 * actual transport message — the template lives here in the domain package
 * while the SMTP transport stays in apps/web.
 */
export function buildLowStockEmailHtml(params: {
  sellerName: string;
  items: LowStockProduct[];
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const itemRows = params.items
    .map((item) => {
      const stockLabel =
        item.stock === 0
          ? `<span style="color:#dc2626;font-weight:600">Out of stock</span>`
          : `<span style="color:#d97706;font-weight:600">${item.stock} left</span>`;
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2;text-align:center">${stockLabel}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2;text-align:right">
          <a href="${siteUrl}/dashboard/products/${item.id}/edit"
             style="color:#3b82f6;text-decoration:none;font-size:13px">Update stock</a>
        </td>
      </tr>`;
    })
    .join("");

  const outOfStockCount = params.items.filter((i) => i.stock === 0).length;
  const lowCount = params.items.length - outOfStockCount;

  const summaryParts: string[] = [];
  if (outOfStockCount > 0) {
    summaryParts.push(
      `<strong>${outOfStockCount}</strong> product${outOfStockCount !== 1 ? "s" : ""} out of stock`
    );
  }
  if (lowCount > 0) {
    summaryParts.push(
      `<strong>${lowCount}</strong> product${lowCount !== 1 ? "s" : ""} running low`
    );
  }

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#7f1d1d;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Low Stock Alert</h1>
      </div>
      <div style="border:1px solid #fecaca;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">
        <p style="font-size:16px">Hi ${params.sellerName},</p>
        <p>The following products need your attention: ${summaryParts.join(" and ")}.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#fef2f2">
              <th style="padding:10px 8px;text-align:left;font-size:13px;text-transform:uppercase;color:#64748b">Product</th>
              <th style="padding:10px 8px;text-align:center;font-size:13px;text-transform:uppercase;color:#64748b">Stock</th>
              <th style="padding:10px 8px;text-align:right;font-size:13px;text-transform:uppercase;color:#64748b">Action</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <a href="${siteUrl}/dashboard/products"
           style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:500">
          Manage Products
        </a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="color:#94a3b8;font-size:12px;margin:0">Amazone Seller Notifications</p>
      </div>
    </div>`;
}

/**
 * Callback type for the email sender injected by the caller.
 * Keeping this as a parameter ensures @amazone/products never imports from
 * apps/web — package boundary rule.
 */
export type SendEmailFn = (params: {
  to: string;
  subject: string;
  html: string;
}) => Promise<void>;

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

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
}

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
