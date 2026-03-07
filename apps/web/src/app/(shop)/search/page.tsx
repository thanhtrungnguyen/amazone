import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { ProductCard } from "@amazone/shared-ui";
import { listProducts } from "@amazone/products";

export const metadata = {
  title: "Search — Amazone",
};

async function searchProducts(query: string): Promise<Awaited<ReturnType<typeof listProducts>>> {
  if (!query.trim()) return [];

  try {
    return await listProducts({
      search: query,
      sortBy: "rating",
      limit: 24,
    });
  } catch {
    return [];
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
