"use server";

import { db, products } from "@amazone/db";
import { and, eq, desc, sql, or, ilike } from "drizzle-orm";

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
}

export async function getSearchSuggestions(
  query: string
): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const tsVector = sql`to_tsvector('english', ${products.name} || ' ' || coalesce(${products.description}, ''))`;
  const tsQuery = sql`plainto_tsquery('english', ${trimmed})`;
  const ftsMatch = sql`${tsVector} @@ ${tsQuery}`;
  const rank = sql`ts_rank(${tsVector}, ${tsQuery})`;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      images: products.images,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          sql`${ftsMatch}`,
          ilike(products.name, `%${trimmed}%`)
        )
      )
    )
    .orderBy(desc(rank))
    .limit(6);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    image: row.images?.[0] ?? null,
  }));
}
