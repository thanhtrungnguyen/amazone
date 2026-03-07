"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/compare-store";

export function CompareBar(): React.ReactElement | null {
  const items = useCompareStore((s) => s.items);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clear = useCompareStore((s) => s.clear);

  const isVisible = items.length >= 2;

  return (
    <div
      role="region"
      aria-label="Product comparison bar"
      className={`fixed inset-x-0 bottom-0 z-50 border-t bg-background shadow-lg transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Product thumbnails */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            Compare ({items.length}):
          </span>
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative shrink-0"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    N/A
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeProduct(item.id)}
                aria-label={`Remove ${item.name} from comparison`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear All
          </Button>
          <Button size="sm" asChild>
            <Link href="/compare">Compare Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
