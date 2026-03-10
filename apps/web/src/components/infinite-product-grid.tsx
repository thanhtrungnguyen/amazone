"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Loader2, PackageSearch } from "lucide-react";
import { ProductCard } from "@amazone/shared-ui";
import { Button } from "@/components/ui/button";
import type { PaginatedProductItem } from "@amazone/products";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfiniteProductGridProps {
  /** First page of products rendered on the server. */
  initialProducts: PaginatedProductItem[];
  /** Cursor to fetch the second page, or null if there is only one page. */
  initialCursor: string | null;
  /** Total number of products matching the current filters. */
  total: number;
  /**
   * Server action that fetches the next page.
   * Receives the current cursor and all active filter params.
   */
  fetchNextPage: (
    cursor: string,
    params: {
      search?: string;
      categoryId?: string;
      sortBy?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
    }
  ) => Promise<{ products: PaginatedProductItem[]; nextCursor: string | null }>;
  /** Active filters passed down from the server so the client can resend them. */
  filterParams: {
    search?: string;
    categoryId?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  };
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function CardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-white">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mt-auto h-6 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfiniteProductGrid({
  initialProducts,
  initialCursor,
  total,
  fetchNextPage,
  filterParams,
}: InfiniteProductGridProps): React.ReactElement {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<PaginatedProductItem[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Sentinel ref — the IntersectionObserver watches this div at the list bottom.
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Guard against double-firing while a fetch is already in flight.
  const isFetchingRef = useRef(false);

  // ── Reset when filters change (searchParams change means new server render
  //    replaces initialProducts; we just sync state to match) ─────────────────
  useEffect(() => {
    setProducts(initialProducts);
    setNextCursor(initialCursor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // ── "Back to top" button visibility ──────────────────────────────────────
  useEffect(() => {
    function onScroll(): void {
      setShowBackToTop(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Fetch next page ───────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!nextCursor || isFetchingRef.current) return;
    isFetchingRef.current = true;

    startTransition(async () => {
      try {
        const result = await fetchNextPage(nextCursor, filterParams);
        setProducts((prev) => [...prev, ...result.products]);
        setNextCursor(result.nextCursor);
      } finally {
        isFetchingRef.current = false;
      }
    });
  }, [nextCursor, fetchNextPage, filterParams]);

  // ── IntersectionObserver on sentinel ─────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && nextCursor && !isFetchingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <p className="text-lg font-medium">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search term.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Product count summary */}
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{products.length}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> product
        {total !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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

        {/* Inline skeleton tiles appear in the same grid while loading */}
        {isPending && <LoadingSkeleton />}
      </div>

      {/* Sentinel div — IntersectionObserver target */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {/* End-of-list message */}
      {!nextCursor && products.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          You&apos;ve seen all {total} product{total !== 1 ? "s" : ""}.
        </p>
      )}

      {/* Manual load-more button — shown while observer fires or as fallback */}
      {nextCursor && !isPending && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isPending}
            className="min-w-[200px]"
            aria-label="Load more products"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Loading…
              </>
            ) : (
              "Load more products"
            )}
          </Button>
        </div>
      )}

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
