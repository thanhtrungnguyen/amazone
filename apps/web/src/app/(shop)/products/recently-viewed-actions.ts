"use server";

import { db, products } from "@amazone/db";
import { inArray } from "drizzle-orm";

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const results = await db
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
    .where(inArray(products.id, ids));

  // Re-order to match the input order
  const map = new Map(results.map((p) => [p.id, p]));
  return ids
    .map((id) => map.get(id))
    .filter((p) => p !== undefined);
}
