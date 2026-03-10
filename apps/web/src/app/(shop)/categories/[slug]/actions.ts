"use server";

import type { PaginatedProductItem } from "@amazone/products";

interface FetchCategoryPageResult {
  products: PaginatedProductItem[];
  nextCursor: string | null;
}

const LIMIT = 24;

/**
 * Server action called by `InfiniteProductGrid` on the category page to fetch
 * subsequent pages of products within that category.
 */
export async function fetchCategoryProductsPage(
  cursor: string,
  params: { categoryId?: string }
): Promise<FetchCategoryPageResult> {
  const { getProductsPaginated } = await import("@amazone/products");

  const result = await getProductsPaginated({
    cursor,
    limit: LIMIT,
    categoryId: params.categoryId,
    sortBy: "newest",
    isActive: true,
  });

  return {
    products: result.products,
    nextCursor: result.nextCursor,
  };
}
