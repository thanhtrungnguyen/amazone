"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { useWishlistStore, type WishlistItem } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

type SortOption = "newest" | "oldest" | "price-low" | "price-high";

function WishlistSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
            </CardContent>
            <CardFooter className="flex gap-2 p-4 pt-0">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function sortItems(items: WishlistItem[], sort: SortOption): WishlistItem[] {
  const sorted = [...items];
  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) => a.addedAt.getTime() - b.addedAt.getTime()
      );
    case "price-low":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-high":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted;
  }
}

export function WishlistContent(): React.ReactElement {
  const items = useWishlistStore((s) => s.items);
  const isHydrated = useWishlistStore((s) => s.isHydrated);
  const isSyncing = useWishlistStore((s) => s.isSyncing);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const addCartItem = useCartStore((s) => s.addItem);

  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const sortedItems = useMemo(
    () => sortItems(items, sortBy),
    [items, sortBy]
  );

  const handleAddToCart = (item: WishlistItem): void => {
    if ((item.stock ?? 1) <= 0) {
      toast.error(`"${item.name}" is out of stock`);
      return;
    }
    addCartItem({
      id: crypto.randomUUID(),
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    removeItem(item.productId);
    toast.success(`"${item.name}" moved to cart`);
  };

  const handleMoveAllToCart = (): void => {
    const inStockItems = items.filter((item) => (item.stock ?? 1) > 0);
    const outOfStockCount = items.length - inStockItems.length;

    if (inStockItems.length === 0) {
      toast.error("All items are out of stock");
      return;
    }

    for (const item of inStockItems) {
      addCartItem({
        id: crypto.randomUUID(),
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
      });
      removeItem(item.productId);
    }

    if (outOfStockCount > 0) {
      toast.success(
        `Moved ${inStockItems.length} item${inStockItems.length === 1 ? "" : "s"} to cart. ${outOfStockCount} out-of-stock item${outOfStockCount === 1 ? "" : "s"} remain.`
      );
    } else {
      toast.success(
        `All ${inStockItems.length} item${inStockItems.length === 1 ? "" : "s"} moved to cart`
      );
    }
  };

  const handleRemove = (item: WishlistItem): void => {
    removeItem(item.productId);
    toast.success(`"${item.name}" removed from wishlist`);
  };

  if (!isHydrated && isSyncing) {
    return <WishlistSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="Your wishlist is empty"
        description="Save items you love to your wishlist. Review them anytime and easily move them to your cart."
        action={
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger size="sm" aria-label="Sort wishlist items">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMoveAllToCart}
            disabled={isSyncing}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Move All to Cart
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearWishlist}
            disabled={isSyncing}
          >
            Clear all
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedItems.map((item) => (
          <Card key={item.productId} className="overflow-hidden">
            <Link href={`/products/${item.slug}`}>
              <div className="relative aspect-square w-full bg-gray-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <ShoppingCart className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  {(item.stock ?? 1) > 0 ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </Link>

            <CardContent className="p-4">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-2 text-sm font-medium hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatPrice(item.price)}
              </p>
            </CardContent>

            <CardFooter className="flex gap-2 p-4 pt-0">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAddToCart(item)}
                disabled={(item.stock ?? 1) <= 0}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                {(item.stock ?? 1) > 0 ? "Add to Cart" : "Unavailable"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemove(item)}
                aria-label={`Remove ${item.name} from wishlist`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="pt-4 text-center">
        <Button variant="outline" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
