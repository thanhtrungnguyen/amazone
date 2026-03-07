import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Shield, RotateCcw } from "lucide-react";
import { RatingStars } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImageGallery } from "./product-image-gallery";
import { ProductReviews } from "./product-reviews";
import { RelatedProducts } from "./related-products";
import { TrackProductView } from "@/components/track-product-view";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProduct(slug: string) {
  const { getProductBySlug } = await import("@amazone/products");
  return (await getProductBySlug(slug)) ?? null;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amazone.com";

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: "Product Not Found — Amazone" };
  }

  const description =
    product.description?.slice(0, 160) ?? `Buy ${product.name} at Amazone`;
  const productUrl = `${BASE_URL}/products/${product.slug}`;

  return {
    title: `${product.name} — Amazone`,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.name,
      description,
      url: productUrl,
      type: "website",
      images: product.images?.[0]
        ? [{ url: product.images[0], alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: product.name,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

function buildProductJsonLd(product: NonNullable<Awaited<ReturnType<typeof fetchProduct>>>): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.[0] ?? undefined,
    url: `${BASE_URL}/products/${product.slug}`,
    sku: product.id,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/products/${product.slug}`,
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: (product.avgRating / 100).toFixed(1),
            bestRating: "5",
            worstRating: "1",
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

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

  const productJsonLd = buildProductJsonLd(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <TrackProductView productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <ProductImageGallery
          images={product.images}
          productName={product.name}
        />

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
              <ProductReviews productId={product.id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      <Suspense
        fallback={
          <div className="mt-12">
            <Skeleton className="mb-6 h-8 w-48" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <RelatedProducts productId={product.id} />
      </Suspense>
    </div>
  );
}
