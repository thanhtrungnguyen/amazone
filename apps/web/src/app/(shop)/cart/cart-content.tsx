"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/stores/cart-store";
import { toast } from "sonner";
import { syncMoveToSavedForLater } from "./saved-for-later-actions";
import { SavedForLaterSection } from "./saved-for-later-section";

function CartItemRow({ item }: { item: CartItem }): React.ReactElement {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [isSaving, setSaving] = useState(false);

  const handleRemove = (): void => {
    removeItem(item.id);
    toast.success(`"${item.name}" removed from cart`);
  };

  const handleDecrement = (): void => {
    if (item.quantity <= 1) {
      handleRemove();
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = (): void => {
    if (item.quantity >= 99) return;
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleSaveForLater = async (): Promise<void> => {
    setSaving(true);
    // Optimistic: remove from cart UI immediately
    removeItem(item.id);
    const result = await syncMoveToSavedForLater(item.id);
    if (result.success) {
      toast.success(`"${item.name}" saved for later`);
    } else {
      toast.error("Failed to save item for later");
    }
    setSaving(false);
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-2 text-sm font-medium">{item.name}</h3>
            <p className="mt-1 text-lg font-bold text-primary">
              {formatPrice(item.price)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Quantity Controls */}
        <div className="mt-2 flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleDecrement}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span
            className="flex h-8 w-10 items-center justify-center text-sm font-medium"
            aria-label={`Quantity: ${item.quantity}`}
          >
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleIncrement}
            disabled={item.quantity >= 99}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="ml-3 text-sm text-muted-foreground">
            {formatPrice(item.price * item.quantity)}
          </span>
          <button
            type="button"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
            onClick={handleSaveForLater}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartContent(): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const isSyncing = useCartStore((s) => s.isSyncing);
  const clear = useCartStore((s) => s.clear);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);

  if (items.length === 0) {
    return (
      <div>
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Your cart is empty"
          description="Looks like you have not added anything to your cart yet. Browse our products and find something you love."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
        <SavedForLaterSection />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Cart Items */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalItems()} {totalItems() === 1 ? "item" : "items"} in cart
          </p>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing...
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear cart
            </Button>
          </div>
        </div>

        <Separator className="mt-3" />

        <div className="divide-y">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <Separator className="mt-2" />

        <div className="pt-4">
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>

        <SavedForLaterSection />
      </div>

      {/* Order Summary */}
      <Card className="w-full lg:w-80 lg:sticky lg:top-24">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({totalItems()} {totalItems() === 1 ? "item" : "items"})
            </span>
            <span className="font-medium">{formatPrice(totalPrice())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-green-600">Free</span>
          </div>

          <Separator />

          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(totalPrice())}</span>
          </div>

          <Button className="w-full" size="lg" asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
