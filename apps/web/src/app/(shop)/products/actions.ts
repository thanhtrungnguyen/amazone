"use server";

import type { PaginatedProductItem } from "@amazone/products";

interface FetchPageParams {
  search?: string;
  categoryId?: string;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
}

interface FetchPageResult {
  products: PaginatedProductItem[];
  nextCursor: string | null;
}

const LIMIT = 24;

/**
 * Server action called by `InfiniteProductGrid` to fetch subsequent pages.
 * Only the `cursor` changes between calls; all filter params are forwarded as-is.
 */
export async function fetchProductsPage(
  cursor: string,
  params: FetchPageParams
): Promise<FetchPageResult> {
  const { getProductsPaginated } = await import("@amazone/products");

  const sortBy = params.sortBy as
    | "price_asc"
    | "price_desc"
    | "newest"
    | "rating"
    | "name"
    | "featured"
    | undefined;

  const result = await getProductsPaginated({
    cursor,
    limit: LIMIT,
    search: params.search,
    categoryId: params.categoryId,
    sortBy: sortBy ?? "featured",
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    inStock: params.inStock,
    isActive: true,
  });

  return {
    products: result.products,
    nextCursor: result.nextCursor,
  };
}
