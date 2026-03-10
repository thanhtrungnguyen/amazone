"use server";

import { db, users, products, orderItems, orders, reviews } from "@amazone/db";
import { eq, and, count, sum, sql, desc, lt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────

export interface SellerProfile {
  id: string;
  name: string;
  image: string | null;
  createdAt: Date;
  totalProducts: number;
  totalSales: number;
  avgRating: number; // stored as rating * 100 (e.g., 450 = 4.50)
  totalReviews: number;
}

export interface SellerProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[] | null;
  avgRating: number;
  reviewCount: number;
  stock: number;
  isFeatured: boolean;
}

export interface SellerProductsResult {
  products: SellerProductItem[];
  nextCursor: string | null;
  total: number;
}

// ─── Actions ────────────────────────────────────────────

/**
 * Fetch a seller's public profile with aggregate stats:
 * - Total active products
 * - Total units sold (from delivered orders)
 * - Average rating across all their products' reviews
 * - Total review count
 */
export async function getSellerProfile(
  sellerId: string
): Promise<SellerProfile | null> {
  // Fetch the user first
  const seller = await db.query.users.findFirst({
    where: and(eq(users.id, sellerId), eq(users.role, "seller")),
    columns: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
    },
  });

  if (!seller) {
    return null;
  }

  // Fetch aggregate stats in parallel
  const [productStats, salesStats, reviewStats] = await Promise.all([
    // Total active products
    db
      .select({ count: count() })
      .from(products)
      .where(
        and(eq(products.sellerId, sellerId), eq(products.isActive, true))
      ),

    // Total units sold from delivered orders
    db
      .select({
        totalSold: sql<number>`coalesce(cast(sum(${orderItems.quantity}) as int), 0)`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(products.sellerId, sellerId),
          eq(orders.status, "delivered")
        )
      ),

    // Average rating and total reviews across all seller's products
    db
      .select({
        avgRating: sql<number>`coalesce(cast(avg(${reviews.rating}) * 100 as int), 0)`,
        totalReviews: count(),
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(eq(products.sellerId, sellerId)),
  ]);

  return {
    id: seller.id,
    name: seller.name,
    image: seller.image,
    createdAt: seller.createdAt,
    totalProducts: productStats[0]?.count ?? 0,
    totalSales: salesStats[0]?.totalSold ?? 0,
    avgRating: reviewStats[0]?.avgRating ?? 0,
    totalReviews: reviewStats[0]?.totalReviews ?? 0,
  };
}

/**
 * Fetch a seller's active products with cursor-based pagination.
 * Returns limit+1 rows to detect whether a next page exists.
 */
export async function getSellerProducts(
  sellerId: string,
  options?: { cursor?: string; limit?: number }
): Promise<SellerProductsResult> {
  const limit = options?.limit ?? 24;
  const cursor = options?.cursor;

  const conditions: SQL[] = [
    eq(products.sellerId, sellerId),
    eq(products.isActive, true),
  ];

  if (cursor) {
    conditions.push(lt(products.id, cursor));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        stock: products.stock,
        isFeatured: products.isFeatured,
      })
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(limit + 1),

    db
      .select({ count: count() })
      .from(products)
      .where(
        and(eq(products.sellerId, sellerId), eq(products.isActive, true))
      ),
  ]);

  const hasNextPage = rows.length > limit;
  const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage
    ? (pageRows[pageRows.length - 1]?.id ?? null)
    : null;

  return {
    products: pageRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      images: row.images as string[] | null,
      avgRating: row.avgRating,
      reviewCount: row.reviewCount,
      stock: row.stock,
      isFeatured: row.isFeatured,
    })),
    nextCursor,
    total: countResult[0]?.count ?? 0,
  };
}
