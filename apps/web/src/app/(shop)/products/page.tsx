import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProductGridSkeleton, ProductCard, EmptyState } from "@amazone/shared-ui";
import { Package } from "lucide-react";
import { ProductSearch } from "./product-search";
import { PaginationControls } from "@/components/pagination-controls";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { BreadcrumbItem } from "@/components/breadcrumbs";

export const revalidate = 60;

export const metadata = {
  title: "Products — Amazone",
  description: "Browse our full product catalog",
};

const PRODUCTS_PER_PAGE = 20;

interface ProductListItem {
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
    cursor?: string;
  }>;
}

async function getProductsData(params: {
  search?: string;
  category?: string;
  sort?: string;
  cursor?: string;
}): Promise<{
  products: ProductListItem[];
  categories: CategoryItem[];
  totalCount: number;
  hasMore: boolean;
}> {
  const { listProducts, countProducts } = await import("@amazone/products");
  const { db } = await import("@amazone/db");

  const sortBy = (params.sort as "price_asc" | "price_desc" | "newest" | "rating" | "name") || "newest";

  const [rawProducts, totalCount, categories] = await Promise.all([
    listProducts({
      search: params.search,
      categoryId: params.category,
      sortBy,
      isActive: true,
      cursor: params.cursor,
      limit: PRODUCTS_PER_PAGE + 1,
    }),
    countProducts({
      search: params.search,
      categoryId: params.category,
      isActive: true,
    }),
    db.query.categories.findMany(),
  ]);

  const hasMore = rawProducts.length > PRODUCTS_PER_PAGE;
  const products = hasMore ? rawProducts.slice(0, PRODUCTS_PER_PAGE) : rawProducts;

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      stock: p.stock,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
      categoryId: p.categoryId,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    totalCount,
    hasMore,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { products, categories, totalCount, hasMore } = await getProductsData(params);
  const lastCursor = products.length > 0 ? products[products.length - 1].id : "";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Showing {products.length} of {totalCount} product{totalCount !== 1 ? "s" : ""}
            {params.search ? ` for "${params.search}"` : ""}
          </p>
        </div>
        <ProductSearch
          defaultSearch={params.search}
          defaultSort={params.sort}
        />
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/products">
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

      {/* Product grid */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        {products.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  slug={product.slug}
                  priceInCents={product.price}
                  compareAtPriceInCents={product.compareAtPrice ?? undefined}
                  image={product.images?.[0] ?? null}
                  rating={product.avgRating}
                  reviewCount={product.reviewCount}
                  badge={product.isFeatured ? "Featured" : undefined}
                />
              ))}
            </div>
            <PaginationControls
              hasMore={hasMore}
              lastCursor={lastCursor}
            />
          </>
        ) : (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No products found"
            description={
              params.search
                ? `No results for "${params.search}". Try a different search term.`
                : "No products match the selected filters."
            }
            action={
              <Link href="/products">
                <Badge variant="outline" className="cursor-pointer">
                  Clear filters
                </Badge>
              </Link>
            }
          />
        )}
      </Suspense>
    </div>
  );
}
