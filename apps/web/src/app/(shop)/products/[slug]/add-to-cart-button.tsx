"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { QuantitySelector } from "@amazone/shared-ui";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    images?: (string | null)[] | null;
    stock: number;
  };
}

export function AddToCartButton({
  product,
}: AddToCartButtonProps): React.ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  const handleAddToCart = () => {
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity,
    });

    setAdded(true);
    toast.success(`Added ${quantity} item(s) to cart`);

    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={product.stock}
          disabled={product.stock === 0}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {added ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            handleAddToCart();
            openCart();
          }}
          disabled={product.stock === 0}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
