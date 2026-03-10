"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@amazone/shared-ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
  badge?: string;
}

interface ProductRecommendationsProps {
  title: string;
  products: RecommendationProduct[];
  viewAllHref?: string;
}

export function ProductRecommendations({
  title,
  products,
  viewAllHref,
}: ProductRecommendationsProps): React.ReactElement | null {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check
    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, products]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 200;
    const scrollAmount = cardWidth * 2;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref}>View All</Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 sm:flex"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 sm:flex"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Left gradient fade */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-8 bg-gradient-to-r from-white to-transparent sm:block dark:from-gray-950" />
        )}

        <div
          ref={scrollRef}
          className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[calc(50%-0.5rem)] flex-shrink-0 snap-start sm:w-[calc(25%-0.75rem)] lg:w-[calc(16.666%-0.833rem)]"
            >
              <ProductCard
                name={product.name}
                slug={product.slug}
                priceInCents={product.price}
                compareAtPriceInCents={product.compareAtPrice ?? undefined}
                image={product.images?.[0] ?? null}
                rating={product.avgRating}
                reviewCount={product.reviewCount}
                badge={product.badge}
              />
            </div>
          ))}
        </div>

        {/* Right gradient fade */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-8 bg-gradient-to-l from-white to-transparent sm:block dark:from-gray-950" />
        )}
      </div>
    </section>
  );
}
