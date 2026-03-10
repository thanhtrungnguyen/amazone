"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  ShoppingCart,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@amazone/shared-utils";
import { toast } from "sonner";
import type { SavedForLaterItem } from "@amazone/cart";
import {
  syncGetSavedForLater,
  syncMoveToCart,
  syncRemoveSavedItem,
} from "./saved-for-later-actions";
import { useCartStore } from "@/stores/cart-store";

function SavedItemRow({
  item,
  onMoveToCart,
  onRemove,
}: {
  item: SavedForLaterItem;
  onMoveToCart: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}): React.ReactElement {
  const [isMoving, setIsMoving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleMoveToCart = async (): Promise<void> => {
    setIsMoving(true);
    await onMoveToCart(item.id);
    setIsMoving(false);
  };

  const handleRemove = async (): Promise<void> => {
    setIsRemoving(true);
    await onRemove(item.id);
    setIsRemoving(false);
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100"
      >
        {item.product.images?.[0] ? (
          <Image
            src={item.product.images[0]}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Bookmark className="h-6 w-6" />
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/products/${item.product.slug}`}
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {item.product.name}
          </Link>
          <p className="mt-1 text-base font-bold text-primary">
            {formatPrice(item.product.price)}
          </p>
          {item.product.stock > 0 ? (
            <p className="text-xs text-green-600">In Stock</p>
          ) : (
            <p className="text-xs text-red-600">Out of Stock</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMoveToCart}
            disabled={isMoving || item.product.stock === 0}
          >
            {isMoving ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <ShoppingCart className="mr-1.5 h-3 w-3" />
            )}
            Move to Cart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3 w-3" />
            )}
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SavedForLaterSection(): React.ReactElement | null {
  const [items, setItems] = useState<SavedForLaterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const refresh = useCartStore((s) => s.refresh);

  const fetchItems = useCallback(async () => {
    const result = await syncGetSavedForLater();
    if (result.success) {
      setItems(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleMoveToCart = async (savedItemId: string): Promise<void> => {
    const item = items.find((i) => i.id === savedItemId);
    // Optimistic removal from saved list
    setItems((prev) => prev.filter((i) => i.id !== savedItemId));

    const result = await syncMoveToCart(savedItemId);
    if (result.success) {
      toast.success(`"${item?.product.name}" moved to cart`);
      // Refresh the cart store so it picks up the new item
      await refresh();
    } else {
      // Rollback
      if (item) {
        setItems((prev) => [...prev, item]);
      }
      toast.error("Failed to move item to cart");
    }
  };

  const handleRemove = async (savedItemId: string): Promise<void> => {
    const item = items.find((i) => i.id === savedItemId);
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.id !== savedItemId));

    const result = await syncRemoveSavedItem(savedItemId);
    if (result.success) {
      toast.success(`"${item?.product.name}" removed`);
    } else {
      // Rollback
      if (item) {
        setItems((prev) => [...prev, item]);
      }
      toast.error("Failed to remove item");
    }
  };

  if (isLoading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <Separator className="mb-4" />

      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <h2 className="text-lg font-semibold">
          Saved for Later ({items.length}{" "}
          {items.length === 1 ? "item" : "items"})
        </h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="divide-y">
          {items.map((item) => (
            <SavedItemRow
              key={item.id}
              item={item}
              onMoveToCart={handleMoveToCart}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
