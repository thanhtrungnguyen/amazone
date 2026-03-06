"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

export function WishlistContent(): React.ReactElement {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const addCartItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (item: (typeof items)[number]): void => {
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

  const handleRemove = (item: (typeof items)[number]): void => {
    removeItem(item.productId);
    toast.success(`"${item.name}" removed from wishlist`);
  };

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
        <Button variant="ghost" size="sm" onClick={clearWishlist}>
          Clear all
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.productId} className="overflow-hidden">
            <Link href={`/products/${item.slug}`}>
              <div className="relative aspect-square w-full bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <ShoppingCart className="h-12 w-12" />
                  </div>
                )}
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
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Add to Cart
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
