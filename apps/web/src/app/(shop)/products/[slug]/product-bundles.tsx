import Image from "next/image";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@amazone/shared-utils";
import { getBundlesForProduct } from "@amazone/products";
import { AddBundleToCartButton } from "./add-bundle-to-cart-button";

interface ProductBundlesProps {
  productId: string;
}

export async function ProductBundles({
  productId,
}: ProductBundlesProps): Promise<React.ReactElement | null> {
  const result = await getBundlesForProduct(productId);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">Frequently Bought Together</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {result.data.map((bundle) => (
          <Card key={bundle.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  {bundle.name}
                </CardTitle>
                {bundle.pricing.discountPercent > 0 && (
                  <Badge variant="secondary" className="text-green-700">
                    Save {bundle.pricing.discountPercent}%
                  </Badge>
                )}
              </div>
              {bundle.description && (
                <p className="text-sm text-muted-foreground">
                  {bundle.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bundle Items */}
              <div className="flex flex-wrap items-center gap-3">
                {bundle.items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {idx > 0 && (
                      <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="group flex items-center gap-2"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-xs font-medium group-hover:underline">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.product.price)}
                          {item.quantity > 1 && ` x${item.quantity}`}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bundle Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatPrice(bundle.pricing.bundlePriceInCents)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(bundle.pricing.originalPriceInCents)}
                    </span>
                  </div>
                  {bundle.pricing.savingsInCents > 0 && (
                    <p className="text-sm font-medium text-green-600">
                      You save {formatPrice(bundle.pricing.savingsInCents)}
                    </p>
                  )}
                </div>
                <AddBundleToCartButton bundle={bundle} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
