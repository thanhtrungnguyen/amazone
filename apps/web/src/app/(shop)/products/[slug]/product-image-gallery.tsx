"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: (string | null)[] | null;
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps): React.JSX.Element {
  const validImages =
    images?.filter((img): img is string => img !== null) ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      prev > 0 ? prev - 1 : validImages.length - 1
    );
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev < validImages.length - 1 ? prev + 1 : 0
    );
  }, [validImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const el = galleryRef.current;
    if (!el || validImages.length <= 1) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    }

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, validImages.length]);

  // Scroll the selected thumbnail into view
  useEffect(() => {
    const container = thumbnailsRef.current;
    if (!container) return;
    const thumb = container.children[selectedIndex] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedIndex]);

  // Empty state
  if (validImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-24 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={galleryRef}
      className="space-y-4"
      tabIndex={0}
      role="region"
      aria-label={`Image gallery for ${productName}`}
      aria-roledescription="carousel"
    >
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {validImages.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              i === selectedIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${validImages.length}`}
            aria-hidden={i !== selectedIndex}
          >
            <Image
              src={src}
              alt={`${productName} — image ${i + 1} of ${validImages.length}`}
              width={600}
              height={600}
              className="h-full w-full object-cover"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Navigation arrows */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-3 right-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              {selectedIndex + 1} / {validImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {validImages.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`View image ${i + 1}`}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === selectedIndex
                  ? "border-primary ring-2 ring-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
