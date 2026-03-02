import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProductGridSkeleton, ProductCard, EmptyState } from "@amazone/shared-ui";
import { Package } from "lucide-react";
import { ProductSearch } from "./product-search";

export const metadata = {
  title: "Products — Amazone",
  description: "Browse our full product catalog",
};

// Placeholder data for development without DB
interface PlaceholderProduct {
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

const placeholderProducts: PlaceholderProduct[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 9999,
    compareAtPrice: 14999,
    images: null,
    stock: 42,
    isActive: true,
    isFeatured: true,
    avgRating: 450,
    reviewCount: 128,
    categoryId: "electronics",
  },
  {
    id: "2",
    name: 'Ultra HD Smart TV 55"',
    slug: "ultra-hd-smart-tv-55",
    price: 49999,
    compareAtPrice: 59999,
    images: null,
    stock: 15,
    isActive: true,
    isFeatured: true,
    avgRating: 420,
    reviewCount: 89,
    categoryId: "electronics",
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    slug: "organic-cotton-t-shirt",
    price: 2499,
    compareAtPrice: null,
    images: null,
    stock: 200,
    isActive: true,
    isFeatured: false,
    avgRating: 380,
    reviewCount: 56,
    categoryId: "clothing",
  },
  {
    id: "4",
    name: "Stainless Steel Water Bottle",
    slug: "stainless-steel-water-bottle",
    price: 1999,
    compareAtPrice: 2999,
    images: null,
    stock: 150,
    isActive: true,
    isFeatured: false,
    avgRating: 460,
    reviewCount: 203,
    categoryId: "home",
  },
  {
    id: "5",
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    price: 7999,
    compareAtPrice: null,
    images: null,
    stock: 30,
    isActive: true,
    isFeatured: true,
    avgRating: 470,
    reviewCount: 312,
    categoryId: "electronics",
  },
  {
    id: "6",
    name: "Running Shoes Pro",
    slug: "running-shoes-pro",
    price: 12999,
    compareAtPrice: 15999,
    images: null,
    stock: 75,
    isActive: true,
    isFeatured: false,
    avgRating: 440,
    reviewCount: 167,
    categoryId: "clothing",
  },
  {
    id: "7",
    name: "Non-Stick Cookware Set",
    slug: "non-stick-cookware-set",
    price: 8999,
    compareAtPrice: 11999,
    images: null,
    stock: 45,
    isActive: true,
    isFeatured: false,
    avgRating: 410,
    reviewCount: 94,
    categoryId: "home",
  },
  {
    id: "8",
    name: "Bluetooth Portable Speaker",
    slug: "bluetooth-portable-speaker",
    price: 3999,
    compareAtPrice: null,
    images: null,
    stock: 100,
    isActive: true,
    isFeatured: true,
    avgRating: 430,
    reviewCount: 245,
    categoryId: "electronics",
  },
];

const placeholderCategories = [
  { id: "electronics", name: "Electronics", slug: "electronics" },
  { id: "clothing", name: "Clothing", slug: "clothing" },
  { id: "home", name: "Home & Kitchen", slug: "home" },
];

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
}

async function getProductsData(params: {
  search?: string;
  category?: string;
  sort?: string;
}): Promise<{
  products: PlaceholderProduct[];
  categories: typeof placeholderCategories;
  fromDb: boolean;
}> {
  try {
    const { listProducts } = await import("@amazone/products");
    const { db } = await import("@amazone/db");

    const [products, categories] = await Promise.all([
      listProducts({
        search: params.search,
        categoryId: params.category,
        sortBy: (params.sort as "price_asc" | "price_desc" | "newest" | "rating" | "name") || "newest",
        isActive: true,
        limit: 20,
      }),
      db.query.categories.findMany(),
    ]);

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
      fromDb: true,
    };
  } catch {
    // Fallback to placeholder data when DB isn't connected
    let filtered = [...placeholderProducts];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params.category) {
      filtered = filtered.filter((p) => p.categoryId === params.category);
    }
    if (params.sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params.sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (params.sort === "rating") {
      filtered.sort((a, b) => b.avgRating - a.avgRating);
    }

    return { products: filtered, categories: placeholderCategories, fromDb: false };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { products, categories, fromDb } = await getProductsData(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} found
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

      {!fromDb && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Showing placeholder data. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            pnpm docker:up && pnpm db:migrate && pnpm db:seed
          </code>{" "}
          for real products.
        </div>
      )}

      {/* Product grid */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        {products.length > 0 ? (
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
