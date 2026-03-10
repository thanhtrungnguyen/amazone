import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProductGridSkeleton } from "@amazone/shared-ui";
import { Package } from "lucide-react";
import { ProductSearch } from "./product-search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { BreadcrumbItem } from "@/components/breadcrumbs";
import {
  ProductFiltersSidebar,
  ProductFiltersMobile,
  parseFilterParams,
  type ActiveFilters,
} from "@/components/product-filters";
import { InfiniteProductGrid } from "@/components/infinite-product-grid";
import { fetchProductsPage } from "./actions";

export const revalidate = 60;

export const metadata = {
  title: "Products — Amazone",
  description: "Browse our full product catalog",
};

const LIMIT = 24;

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
  }>;
}

async function getCategories(): Promise<CategoryItem[]> {
  const { db } = await import("@amazone/db");
  const rows = await db.query.categories.findMany();
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const sortBy = (params.sort as
    | "price_asc"
    | "price_desc"
    | "newest"
    | "rating"
    | "name"
    | "featured") || "featured";

  const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;
  const minRating = params.rating ? parseFloat(params.rating) : undefined;
  const inStock = params.inStock === "1" ? true : undefined;

  const safeMinPrice = minPrice !== undefined && !isNaN(minPrice) ? minPrice : undefined;
  const safeMaxPrice = maxPrice !== undefined && !isNaN(maxPrice) ? maxPrice : undefined;
  const safeMinRating = minRating !== undefined && !isNaN(minRating) ? minRating : undefined;

  const { getProductsPaginated } = await import("@amazone/products");

  const [firstPage, categories] = await Promise.all([
    getProductsPaginated({
      limit: LIMIT,
      search: params.search,
      categoryId: params.category,
      sortBy,
      minPrice: safeMinPrice,
      maxPrice: safeMaxPrice,
      minRating: safeMinRating,
      inStock,
      isActive: true,
    }),
    getCategories(),
  ]);

  const activeCategoryName = params.category
    ? categories.find((c) => c.id === params.category)?.name
    : undefined;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: activeCategoryName ? "/products" : undefined },
  ];
  if (activeCategoryName) {
    breadcrumbItems.push({ label: activeCategoryName });
  }

  // Build activeFilters for the sidebar from the raw string params
  const urlParams = new URLSearchParams();
  if (params.minPrice) urlParams.set("minPrice", params.minPrice);
  if (params.maxPrice) urlParams.set("maxPrice", params.maxPrice);
  if (params.rating) urlParams.set("rating", params.rating);
  if (params.inStock) urlParams.set("inStock", params.inStock);
  if (params.sort) urlParams.set("sort", params.sort);
  const activeFilters: ActiveFilters = parseFilterParams(urlParams);

  // Filter params forwarded to the client so it can pass them back in
  // subsequent fetchProductsPage calls.
  const filterParams = {
    search: params.search,
    categoryId: params.category,
    sortBy: params.sort,
    minPrice: safeMinPrice,
    maxPrice: safeMaxPrice,
    minRating: safeMinRating,
    inStock,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Top header row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {firstPage.total} product{firstPage.total !== 1 ? "s" : ""}
            {params.search ? ` for "${params.search}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter trigger — hidden on desktop */}
          <ProductFiltersMobile basePath="/products" activeFilters={activeFilters} />
          <ProductSearch
            defaultSearch={params.search}
            defaultSort={params.sort}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/products${params.search ? `?search=${params.search}` : ""}`}>
          <Badge
            variant={!params.category ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            All
          </Badge>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}${params.search ? `&search=${params.search}` : ""}${params.sort ? `&sort=${params.sort}` : ""}`}
          >
            <Badge
              variant={params.category === cat.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Two-column layout: sidebar + grid */}
      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <ProductFiltersSidebar basePath="/products" activeFilters={activeFilters} />

        {/* Infinite product grid */}
        <div className="min-w-0 flex-1">
          {firstPage.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {params.search
                  ? `No results for "${params.search}". Try a different search term.`
                  : "No products match the selected filters."}
              </p>
              <Link href="/products" className="mt-4">
                <Badge variant="outline" className="cursor-pointer">
                  Clear filters
                </Badge>
              </Link>
            </div>
          ) : (
            <Suspense fallback={<ProductGridSkeleton count={LIMIT} />}>
              <InfiniteProductGrid
                initialProducts={firstPage.products}
                initialCursor={firstPage.nextCursor}
                total={firstPage.total}
                fetchNextPage={fetchProductsPage}
                filterParams={filterParams}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
