"use client";

import { useEffect, useState, useTransition } from "react";
import { ProductCard } from "@amazone/shared-ui";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { getProductsByIds } from "@/app/(shop)/products/recently-viewed-actions";

const MAX_DISPLAYED = 8;

type Product = Awaited<ReturnType<typeof getProductsByIds>>[number];

function SkeletonCard(): React.ReactElement {
  return (
    <div className="flex w-48 shrink-0 flex-col overflow-hidden rounded-lg border bg-white">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function RecentlyViewed(): React.ReactElement | null {
  const { productIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasFetched, setHasFetched] = useState(false);

  const idsToFetch = productIds.slice(0, MAX_DISPLAYED);

  useEffect(() => {
    if (idsToFetch.length === 0) {
      setProducts([]);
      setHasFetched(true);
      return;
    }

    startTransition(async () => {
      try {
        const data = await getProductsByIds(idsToFetch);
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setHasFetched(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(idsToFetch)]);

  // Don't render anything if there are no recently viewed products
  if (hasFetched && products.length === 0 && !isPending) {
    return null;
  }

  // Don't render until we know whether there are items
  if (!hasFetched && idsToFetch.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="mb-6 text-3xl font-semibold">Recently Viewed</h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        role="list"
        aria-label="Recently viewed products"
      >
        {isPending && !hasFetched
          ? Array.from({ length: Math.min(idsToFetch.length, MAX_DISPLAYED) }, (_, i) => (
              <div key={i} role="listitem" className="shrink-0">
                <SkeletonCard />
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} role="listitem" className="w-48 shrink-0">
                <ProductCard
                  name={product.name}
                  slug={product.slug}
                  priceInCents={product.price}
                  compareAtPriceInCents={product.compareAtPrice ?? undefined}
                  image={product.images?.[0] ?? null}
                  rating={product.avgRating}
                  reviewCount={product.reviewCount}
                />
              </div>
            ))}
      </div>
    </section>
  );
}
