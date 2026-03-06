import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { ProductCard } from "@amazone/shared-ui";

export const metadata = {
  title: "Search — Amazone",
};

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
}

const placeholderProducts: SearchProduct[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 9999,
    compareAtPrice: 12999,
    images: null,
    avgRating: 450,
    reviewCount: 128,
  },
  {
    id: "2",
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    price: 7999,
    compareAtPrice: null,
    images: null,
    avgRating: 470,
    reviewCount: 312,
  },
  {
    id: "3",
    name: "USB-C Fast Charger",
    slug: "usb-c-fast-charger",
    price: 2499,
    compareAtPrice: 3499,
    images: null,
    avgRating: 440,
    reviewCount: 89,
  },
  {
    id: "4",
    name: "Bluetooth Portable Speaker",
    slug: "bluetooth-portable-speaker",
    price: 3999,
    compareAtPrice: null,
    images: null,
    avgRating: 430,
    reviewCount: 245,
  },
  {
    id: "5",
    name: "Ergonomic Office Chair",
    slug: "ergonomic-office-chair",
    price: 29999,
    compareAtPrice: 39999,
    images: null,
    avgRating: 460,
    reviewCount: 67,
  },
  {
    id: "6",
    name: "4K Ultra HD Monitor",
    slug: "4k-ultra-hd-monitor",
    price: 44999,
    compareAtPrice: null,
    images: null,
    avgRating: 480,
    reviewCount: 203,
  },
];

async function searchProducts(query: string): Promise<SearchProduct[]> {
  if (!query.trim()) return [];

  try {
    const { listProducts } = await import("@amazone/products");
    const products = await listProducts({
      search: query,
      sortBy: "rating",
      limit: 24,
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    }));
  } catch {
    // Fallback: filter placeholder by query
    const q = query.toLowerCase();
    return placeholderProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.includes(q)
    );
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await searchProducts(q);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        {q ? (
          <>
            <h1 className="text-3xl font-bold">
              Search results for &ldquo;{q}&rdquo;
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Search</h1>
            <p className="text-muted-foreground">
              Enter a search term to find products.
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {q && results.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <SearchX className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No results found</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            We couldn&apos;t find any products matching &ldquo;{q}&rdquo;. Try a
            different search term or browse our categories.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/categories">Browse Categories</Link>
            </Button>
            <Button asChild>
              <Link href="/products">All Products</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              slug={product.slug}
              priceInCents={product.price}
              compareAtPriceInCents={product.compareAtPrice ?? undefined}
              image={product.images?.[0] ?? null}
              rating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
