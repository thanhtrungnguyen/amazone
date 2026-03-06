import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@amazone/shared-ui";
import {
  ShoppingCart,
  Package,
  CreditCard,
  Star,
  Users,
  Database,
  Layers,
  Shield,
  ArrowRight,
  Zap,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amazone.com";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Amazone — Your One-Stop E-Commerce Platform",
  description:
    "Shop millions of products with fast delivery, secure payments, and great prices. Electronics, clothing, home goods, and more.",
  alternates: {
    canonical: BASE_URL,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Amazone",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const features = [
  {
    icon: ShoppingCart,
    title: "Cart & Checkout",
    description: "Optimistic cart updates with Stripe-powered checkout flow",
    badge: "@amazone/cart",
  },
  {
    icon: Package,
    title: "Product Catalog",
    description:
      "Cursor-based pagination, fuzzy search, and category filtering",
    badge: "@amazone/products",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Stripe integration with webhook handling and order tracking",
    badge: "@amazone/checkout",
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    description: "Verified purchase reviews with star ratings",
    badge: "@amazone/reviews",
  },
  {
    icon: Users,
    title: "User Accounts",
    description: "NextAuth.js v5 with customer, seller, and admin roles",
    badge: "@amazone/users",
  },
  {
    icon: Database,
    title: "Database",
    description:
      "PostgreSQL with Drizzle ORM — type-safe queries and migrations",
    badge: "@amazone/db",
  },
  {
    icon: Layers,
    title: "Shared UI",
    description: "Reusable components: price display, rating stars, and more",
    badge: "@amazone/shared-ui",
  },
  {
    icon: Shield,
    title: "Type Safety",
    description: "Zod schemas, strict TypeScript, and Nx package boundaries",
    badge: "@amazone/shared-utils",
  },
];

// Placeholder featured products (used when DB is not connected)
const placeholderFeatured = [
  {
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 9999,
    compareAtPrice: 14999,
    image: null,
    avgRating: 450,
    reviewCount: 128,
  },
  {
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    price: 7999,
    compareAtPrice: undefined,
    image: null,
    avgRating: 470,
    reviewCount: 312,
  },
  {
    name: 'Ultra HD Smart TV 55"',
    slug: "ultra-hd-smart-tv-55",
    price: 49999,
    compareAtPrice: 59999,
    image: null,
    avgRating: 420,
    reviewCount: 89,
  },
  {
    name: "Bluetooth Portable Speaker",
    slug: "bluetooth-portable-speaker",
    price: 3999,
    compareAtPrice: undefined,
    image: null,
    avgRating: 430,
    reviewCount: 245,
  },
];

async function getFeaturedProducts() {
  try {
    const { listProducts } = await import("@amazone/products");
    const products = await listProducts({
      isFeatured: true,
      isActive: true,
      sortBy: "newest",
      limit: 4,
    });
    return products.map((p) => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? undefined,
      image: p.images?.[0] ?? null,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    }));
  } catch {
    return placeholderFeatured;
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <Badge variant="secondary" className="text-sm">
          Nx Monorepo + Next.js 16 + React 19
        </Badge>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Amazone</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          A full-featured e-commerce platform built with modern web
          technologies. Package-based architecture with domain-driven design.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Seller Dashboard</Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">Featured Products</h2>
          <Button variant="ghost" asChild>
            <Link href="/products" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard
              key={product.slug}
              name={product.name}
              slug={product.slug}
              priceInCents={product.price}
              compareAtPriceInCents={product.compareAtPrice}
              image={product.image}
              rating={product.avgRating}
              reviewCount={product.reviewCount}
              badge="Featured"
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* Shop by Category */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">Shop by Category</h2>
          <Button variant="ghost" asChild>
            <Link href="/categories" className="flex items-center gap-1">
              All Categories <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Electronics", slug: "electronics", emoji: "🎧", count: 156 },
            { name: "Clothing", slug: "clothing", emoji: "👕", count: 423 },
            { name: "Home & Kitchen", slug: "home-kitchen", emoji: "🏠", count: 289 },
            { name: "Books", slug: "books", emoji: "📚", count: 1024 },
            { name: "Sports & Outdoors", slug: "sports-outdoors", emoji: "⚽", count: 178 },
            { name: "Toys & Games", slug: "toys-games", emoji: "🎮", count: 312 },
          ].map((cat) => (
            <Link key={cat.slug} href={`/categories/${cat.slug}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cat.count} products
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* Deals promo banner */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <Zap className="h-10 w-10" />
          <h2 className="text-3xl font-bold">Today&apos;s Deals</h2>
          <p className="max-w-lg text-lg text-white/90">
            Up to 50% off on selected products. Lightning deals updated every
            hour.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-orange-600 hover:bg-white/90 dark:bg-white dark:text-orange-600 dark:hover:bg-white/90"
            asChild
          >
            <Link href="/deals">Shop Deals</Link>
          </Button>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <Truck className="h-8 w-8 text-primary" />
            <p className="font-semibold">Free Shipping</p>
            <p className="text-sm text-muted-foreground">On orders over $50</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <RotateCcw className="h-8 w-8 text-primary" />
            <p className="font-semibold">Easy Returns</p>
            <p className="text-sm text-muted-foreground">30-day return policy</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Headphones className="h-8 w-8 text-primary" />
            <p className="font-semibold">24/7 Support</p>
            <p className="text-sm text-muted-foreground">Chat, email, or phone</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          Domain Packages
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Badge variant="outline" className="font-mono text-xs">
                  {feature.badge}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tech Stack */}
      <section className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Next.js 16",
            "React 19",
            "TypeScript 5.9",
            "Tailwind CSS 4",
            "shadcn/ui",
            "Drizzle ORM",
            "PostgreSQL",
            "Stripe",
            "NextAuth.js v5",
            "Zustand",
            "Zod",
            "Nx 22",
            "Vitest",
            "pnpm",
          ].map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
      </section>
    </>
  );
}
