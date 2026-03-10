"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { useState } from "react";
import type { BundleWithPrice } from "@amazone/products";

interface AddBundleToCartButtonProps {
  bundle: BundleWithPrice;
}

export function AddBundleToCartButton({
  bundle,
}: AddBundleToCartButtonProps): React.ReactElement {
  const addItem = useCartStore((s) => s.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBundle = (): void => {
    setIsAdding(true);

    // Add each bundle item to the cart
    for (const item of bundle.items) {
      addItem({
        id: `bundle-${bundle.id}-${item.product.id}-${Date.now()}`,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images?.[0] ?? null,
        quantity: item.quantity,
      });
    }

    toast.success(`"${bundle.name}" bundle added to cart`);
    setIsAdding(false);
  };

  // Check if all products in the bundle are in stock
  const allInStock = bundle.items.every(
    (item) => item.product.stock >= item.quantity
  );

  return (
    <Button
      onClick={handleAddBundle}
      disabled={isAdding || !allInStock}
      size="sm"
    >
      {isAdding ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-1.5 h-4 w-4" />
      )}
      {allInStock ? "Add Bundle to Cart" : "Out of Stock"}
    </Button>
  );
}
