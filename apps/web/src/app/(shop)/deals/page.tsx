import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@amazone/shared-ui";
import { formatPrice } from "@amazone/shared-utils";
import { Zap, Tag, ArrowRight } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Today's Deals - Amazone",
  description:
    "Discover daily deals, lightning offers, and exclusive discounts on top products at Amazone.",
  openGraph: {
    title: "Today's Deals - Amazone",
    description:
      "Discover daily deals, lightning offers, and exclusive discounts on top products at Amazone.",
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealProduct {
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number;
  image: string | null;
  avgRating: number;
  reviewCount: number;
}

interface LightningDeal extends DealProduct {
  claimedPercent: number;
}

// ---------------------------------------------------------------------------
// Data fetching with dynamic import + fallback
// ---------------------------------------------------------------------------

interface DealsData {
  dealOfTheDay: DealProduct | null;
  deals: DealProduct[];
  lightningDeals: LightningDeal[];
}

async function getDealsData(): Promise<DealsData> {
  try {
    const { db, products } = await import("@amazone/db");
    const { and, isNotNull, gt, eq, desc, sql, notInArray } = await import(
      "drizzle-orm"
    );

    // ── Deal of the Day: highest discount percentage ──
    const onSaleCondition = and(
      isNotNull(products.compareAtPrice),
      gt(products.compareAtPrice, products.price),
      eq(products.isActive, true)
    );

    const [topDeal] = await db
      .select({
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        image: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        stock: products.stock,
        discountPct: sql<number>`round(((${products.compareAtPrice} - ${products.price})::numeric / ${products.compareAtPrice}::numeric) * 100)`.as(
          "discount_pct"
        ),
      })
      .from(products)
      .where(onSaleCondition)
      .orderBy(
        desc(
          sql`((${products.compareAtPrice} - ${products.price})::numeric / ${products.compareAtPrice}::numeric)`
        )
      )
      .limit(1);

    if (!topDeal) {
      return { dealOfTheDay: null, deals: [], lightningDeals: [] };
    }

    const resolvedDealOfTheDay: DealProduct = {
      name: topDeal.name,
      slug: topDeal.slug,
      price: topDeal.price,
      compareAtPrice: topDeal.compareAtPrice as number,
      image: topDeal.image?.[0] ?? null,
      avgRating: topDeal.avgRating,
      reviewCount: topDeal.reviewCount,
    };

    // ── Lightning Deals: 4 popular on-sale products (excluding deal of the day) ──
    const excludeSlugs = topDeal ? [topDeal.slug] : [];

    const lightningRows = await db
      .select({
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        image: products.images,
        avgRating: products.avgRating,
        reviewCount: products.reviewCount,
        stock: products.stock,
      })
      .from(products)
      .where(
        excludeSlugs.length > 0
          ? and(onSaleCondition, notInArray(products.slug, excludeSlugs))
          : onSaleCondition
      )
      .orderBy(desc(products.reviewCount))
      .limit(4);

    const resolvedLightningDeals: LightningDeal[] = lightningRows.map((row) => ({
      name: row.name,
      slug: row.slug,
      price: row.price,
      compareAtPrice: row.compareAtPrice as number,
      image: row.image?.[0] ?? null,
      avgRating: row.avgRating,
      reviewCount: row.reviewCount,
      claimedPercent: Math.max(
        10,
        Math.min(
          95,
          100 -
            Math.round(
              (row.stock / (row.stock + row.reviewCount)) * 100
            )
        )
      ),
    }));

    // ── Products on Sale (general grid) ──
    const { listProducts } = await import("@amazone/products");
    const allProducts = await listProducts({
      isActive: true,
      sortBy: "price_asc",
      limit: 20,
    });

    const onSaleProducts = allProducts
      .filter(
        (p) =>
          p.compareAtPrice !== null &&
          p.compareAtPrice !== undefined &&
          p.compareAtPrice > p.price
      )
      .slice(0, 6)
      .map((p) => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice as number,
        image: p.images?.[0] ?? null,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
      }));

    return {
      dealOfTheDay: resolvedDealOfTheDay,
      deals: onSaleProducts,
      lightningDeals: resolvedLightningDeals,
    };
  } catch {
    return {
      dealOfTheDay: null,
      deals: [],
      lightningDeals: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** End time = midnight tonight (gives a rolling 24-hour countdown). */
function getDealEndTime(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DealsPage(): Promise<React.ReactElement> {
  const { dealOfTheDay, deals, lightningDeals } = await getDealsData();
  const dealEnd = getDealEndTime();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Today's Deals" },
        ]}
      />

      {/* ---- Hero Banner ---- */}
      <section className="mb-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-6 py-12 text-white sm:px-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-7 w-7" aria-hidden="true" />
            <h1 className="text-3xl font-bold sm:text-4xl">Today&#39;s Deals</h1>
          </div>
          <p className="max-w-xl text-lg text-white/90">
            Handpicked discounts updated every 24 hours. Grab top-rated products
            before they sell out.
          </p>
        </div>
      </section>

      {/* ---- Deal of the Day ---- */}
      {dealOfTheDay && (
        <section className="mb-12" aria-labelledby="deal-of-the-day-heading">
          <h2
            id="deal-of-the-day-heading"
            className="mb-6 flex items-center gap-2 text-2xl font-bold"
          >
            <Tag className="h-6 w-6 text-red-600" aria-hidden="true" />
            Deal of the Day
          </h2>

          <Card className="overflow-hidden">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
                {dealOfTheDay.image ? (
                  <Image
                    src={dealOfTheDay.image}
                    alt={dealOfTheDay.name}
                    width={600}
                    height={600}
                    className="max-h-72 w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center text-gray-400">
                    <svg
                      className="h-24 w-24"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-4 p-6">
                <Badge variant="destructive" className="w-fit">
                  {discountPercent(dealOfTheDay.price, dealOfTheDay.compareAtPrice)}
                  % OFF
                </Badge>

                <h3 className="text-2xl font-bold">{dealOfTheDay.name}</h3>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(dealOfTheDay.price)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(dealOfTheDay.compareAtPrice)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {dealOfTheDay.reviewCount.toLocaleString()} reviews
                </p>

                <CountdownTimer endTime={dealEnd} />

                <div className="mt-2 flex gap-3">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600" asChild>
                    <Link href={`/products/${dealOfTheDay.slug}`}>Buy Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/products/${dealOfTheDay.slug}`}>Add to Cart</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {dealOfTheDay && <Separator className="mb-12" />}

      {/* ---- Products on Sale ---- */}
      <section className="mb-12" aria-labelledby="sale-products-heading">
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="sale-products-heading"
            className="text-2xl font-bold"
          >
            Products on Sale
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {deals.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No products on sale right now. Check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {deals.map((product) => (
              <ProductCard
                key={product.slug}
                name={product.name}
                slug={product.slug}
                priceInCents={product.price}
                compareAtPriceInCents={product.compareAtPrice}
                image={product.image}
                rating={product.avgRating}
                reviewCount={product.reviewCount}
                badge="Sale"
              />
            ))}
          </div>
        )}
      </section>

      <Separator className="mb-12" />

      {/* ---- Lightning Deals ---- */}
      <section aria-labelledby="lightning-deals-heading">
        <h2
          id="lightning-deals-heading"
          className="mb-6 flex items-center gap-2 text-2xl font-bold"
        >
          <Zap className="h-6 w-6 text-yellow-500" aria-hidden="true" />
          Lightning Deals
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lightningDeals.map((deal) => (
            <Link
              key={deal.slug}
              href={`/products/${deal.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border bg-white dark:bg-gray-900 transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                {deal.image ? (
                  <Image
                    src={deal.image}
                    alt={deal.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <svg
                      className="h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-gray-900">
                  Lightning
                </span>
                <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                  -{discountPercent(deal.price, deal.compareAtPrice)}%
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600">
                  {deal.name}
                </h3>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(deal.price)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    {formatPrice(deal.compareAtPrice)}
                  </span>
                </div>

                {/* Claimed progress bar */}
                <div className="mt-auto">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{deal.claimedPercent}% claimed</span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                    role="progressbar"
                    aria-valuenow={deal.claimedPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${deal.claimedPercent}% claimed`}
                  >
                    <div
                      className={
                        "h-full rounded-full transition-all " +
                        (deal.claimedPercent >= 75
                          ? "bg-red-500"
                          : deal.claimedPercent >= 50
                            ? "bg-orange-500"
                            : "bg-green-500")
                      }
                      style={{ width: `${deal.claimedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
