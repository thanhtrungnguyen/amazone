"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompareStore, type CompareItem } from "@/stores/compare-store";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@amazone/shared-utils";
import { toast } from "sonner";

export function CompareContent(): React.ReactElement {
  const items = useCompareStore((s) => s.items);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clear = useCompareStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);

  if (items.length < 2) {
    return <EmptyState count={items.length} />;
  }

  const lowestPrice = Math.min(...items.map((i) => i.price));

  const handleAddToCart = (item: CompareItem): void => {
    addItem({
      id: crypto.randomUUID(),
      productId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    });
    toast.success(`"${item.name}" added to cart`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Comparing {items.length} products
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear All
        </Button>
      </div>

      {/* Comparison table — horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="w-36 border-b bg-muted/50 p-4 text-left text-sm font-medium text-muted-foreground">
                <span className="sr-only">Attribute</span>
              </th>
              {items.map((item) => (
                <th
                  key={item.id}
                  className="border-b border-l bg-muted/50 p-4 text-center"
                >
                  <button
                    type="button"
                    onClick={() => removeProduct(item.id)}
                    aria-label={`Remove ${item.name} from comparison`}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Image row */}
            <tr>
              <td className="border-b p-4 text-sm font-medium text-muted-foreground">
                Image
              </td>
              {items.map((item) => (
                <td key={item.id} className="border-b border-l p-4 text-center">
                  <Link
                    href={`/products/${item.slug}`}
                    className="mx-auto block h-40 w-40"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={160}
                        height={160}
                        className="mx-auto h-40 w-40 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                        No image
                      </div>
                    )}
                  </Link>
                </td>
              ))}
            </tr>

            {/* Name row */}
            <tr>
              <td className="border-b p-4 text-sm font-medium text-muted-foreground">
                Name
              </td>
              {items.map((item) => (
                <td key={item.id} className="border-b border-l p-4 text-center">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                </td>
              ))}
            </tr>

            {/* Price row */}
            <tr>
              <td className="border-b p-4 text-sm font-medium text-muted-foreground">
                Price
              </td>
              {items.map((item) => (
                <td key={item.id} className="border-b border-l p-4 text-center">
                  <span
                    className={`text-lg font-bold ${
                      item.price === lowestPrice
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {formatPrice(item.price)}
                  </span>
                  {item.price === lowestPrice && (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-green-700"
                    >
                      Lowest
                    </Badge>
                  )}
                </td>
              ))}
            </tr>

            {/* Add to Cart row */}
            <tr>
              <td className="p-4 text-sm font-medium text-muted-foreground">
                Action
              </td>
              {items.map((item) => (
                <td key={item.id} className="border-l p-4 text-center">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ count }: { count: number }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">
        {count === 0
          ? "No products to compare"
          : "Add one more product to compare"}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {count === 0
          ? "Browse products and click the compare icon to add them to your comparison list. You need at least 2 products to compare."
          : "You have 1 product selected. Add at least one more product to start comparing."}
      </p>
      <Button asChild>
        <Link href="/products">Browse Products</Link>
      </Button>
    </div>
  );
}
