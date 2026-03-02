import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react";
import { RatingStars } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { AddToCartButton } from "./add-to-cart-button";

// TODO: Fetch from DB when connected
// import { getProductBySlug } from "@amazone/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder product for development before DB is connected
const placeholderProduct = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Premium Wireless Headphones",
  slug: "premium-wireless-headphones",
  description:
    "Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for music lovers, commuters, and remote workers.",
  price: 9999,
  compareAtPrice: 14999,
  images: ["/placeholder-product.jpg"],
  stock: 42,
  isActive: true,
  isFeatured: true,
  avgRating: 450,
  reviewCount: 128,
  categoryId: null,
  sellerId: "00000000-0000-0000-0000-000000000000",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  // TODO: const product = await getProductBySlug(slug);
  const product = slug === placeholderProduct.slug ? placeholderProduct : null;

  if (!product) {
    return { title: "Product Not Found — Amazone" };
  }

  return {
    title: `${product.name} — Amazone`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  // TODO: const product = await getProductBySlug(slug);
  const product = slug === placeholderProduct.slug ? placeholderProduct : null;

  if (!product) {
    notFound();
  }

  const hasDiscount =
    product.compareAtPrice !== null &&
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl text-gray-300">
                <ShoppingCart className="h-24 w-24" />
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="h-20 w-20 overflow-hidden rounded-md border"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4">
          {product.isFeatured && (
            <Badge className="w-fit">Featured</Badge>
          )}

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <RatingStars
              rating={product.avgRating / 100}
              count={product.reviewCount}
              size="md"
            />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <Badge variant="secondary" className="text-green-700">
                  Save {discountPercent}%
                </Badge>
              </>
            )}
          </div>

          <Separator />

          {/* Stock */}
          <div className="text-sm">
            {product.stock > 0 ? (
              <span className="text-green-600">
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart */}
          <AddToCartButton product={product} />

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Free Shipping
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Secure Payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                30-Day Returns
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description & Reviews */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.reviewCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose mt-4 max-w-none">
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <Suspense
              fallback={
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              }
            >
              <p className="text-muted-foreground">
                Connect your database to see reviews. Run{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  docker compose up -d && pnpm db:migrate
                </code>
              </p>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
