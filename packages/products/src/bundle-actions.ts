"use server";

import {
  db,
  productBundles,
  productBundleItems,
} from "@amazone/db";
import { eq, and, sql } from "drizzle-orm";
import { createLogger } from "@amazone/shared-utils";
import { cached } from "@amazone/shared-utils/server";

const logger = createLogger("product-bundles");

// ─── Types ────────────────────────────────────────────────

export interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  stock: number;
}

export interface BundleItem {
  id: string;
  quantity: number;
  product: BundleProduct;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discountPercent: number;
  isActive: boolean;
  items: BundleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BundlePriceInfo {
  originalPriceInCents: number;
  bundlePriceInCents: number;
  savingsInCents: number;
  discountPercent: number;
}

export interface BundleWithPrice extends Bundle {
  pricing: BundlePriceInfo;
}

// ─── Actions ──────────────────────────────────────────────

/**
 * Get a bundle by its slug, including all items with product details.
 */
export async function getBundleBySlug(
  slug: string
): Promise<{ success: true; data: Bundle } | { success: false; error: string }> {
  try {
    const bundle = await db.query.productBundles.findFirst({
      where: eq(productBundles.slug, slug),
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      return { success: false, error: "errors.bundles.not_found" };
    }

    return {
      success: true,
      data: {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        discountPercent: bundle.discountPercent,
        isActive: bundle.isActive,
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
        items: bundle.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            images: item.product.images as string[] | null,
            stock: item.product.stock,
          },
        })),
      },
    };
  } catch (error) {
    logger.error({ err: error, slug }, "getBundleBySlug: DB error");
    return { success: false, error: "errors.bundles.fetch_failed" };
  }
}

/**
 * Get all active bundles with their items and product details.
 */
export async function getActiveBundles(): Promise<
  { success: true; data: BundleWithPrice[] } | { success: false; error: string }
> {
  try {
    const bundles = await cached(
      "bundles:active",
      () =>
        db.query.productBundles.findMany({
          where: eq(productBundles.isActive, true),
          with: {
            items: {
              with: {
                product: {
                  columns: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                    stock: true,
                  },
                },
              },
            },
          },
          orderBy: (b, { desc }) => [desc(b.createdAt)],
        }),
      { ttl: 300 }
    );

    const result: BundleWithPrice[] = bundles.map((bundle) => {
      const items: BundleItem[] = bundle.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: item.product.images as string[] | null,
          stock: item.product.stock,
        },
      }));

      const pricing = computeBundlePrice(items, bundle.discountPercent);

      return {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        discountPercent: bundle.discountPercent,
        isActive: bundle.isActive,
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
        items,
        pricing,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    logger.error({ err: error }, "getActiveBundles: DB error");
    return { success: false, error: "errors.bundles.fetch_failed" };
  }
}

/**
 * Get all active bundles that contain a specific product.
 * Used on product detail pages to show "Frequently Bought Together" bundle offers.
 */
export async function getBundlesForProduct(
  productId: string
): Promise<
  { success: true; data: BundleWithPrice[] } | { success: false; error: string }
> {
  try {
    // Find bundle IDs that contain this product
    const bundleItemRows = await db
      .select({ bundleId: productBundleItems.bundleId })
      .from(productBundleItems)
      .where(eq(productBundleItems.productId, productId));

    if (bundleItemRows.length === 0) {
      return { success: true, data: [] };
    }

    const bundleIds = bundleItemRows.map((r) => r.bundleId);

    // Fetch the full bundles with items
    const bundles = await db.query.productBundles.findMany({
      where: and(
        eq(productBundles.isActive, true),
        sql`${productBundles.id} IN ${bundleIds}`
      ),
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    const result: BundleWithPrice[] = bundles.map((bundle) => {
      const items: BundleItem[] = bundle.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: item.product.images as string[] | null,
          stock: item.product.stock,
        },
      }));

      const pricing = computeBundlePrice(items, bundle.discountPercent);

      return {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        discountPercent: bundle.discountPercent,
        isActive: bundle.isActive,
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
        items,
        pricing,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    logger.error({ err: error, productId }, "getBundlesForProduct: DB error");
    return { success: false, error: "errors.bundles.fetch_failed" };
  }
}

/**
 * Calculate the bundle price: sum of individual product prices * quantities,
 * then apply the discount percentage.
 */
export async function calculateBundlePrice(
  bundleId: string
): Promise<
  { success: true; data: BundlePriceInfo } | { success: false; error: string }
> {
  try {
    const bundle = await db.query.productBundles.findFirst({
      where: eq(productBundles.id, bundleId),
      with: {
        items: {
          with: {
            product: {
              columns: { price: true },
            },
          },
        },
      },
    });

    if (!bundle) {
      return { success: false, error: "errors.bundles.not_found" };
    }

    const items: BundleItem[] = bundle.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: "",
        name: "",
        slug: "",
        price: item.product.price,
        images: null,
        stock: 0,
      },
    }));

    return {
      success: true,
      data: computeBundlePrice(items, bundle.discountPercent),
    };
  } catch (error) {
    logger.error({ err: error, bundleId }, "calculateBundlePrice: DB error");
    return { success: false, error: "errors.bundles.price_calc_failed" };
  }
}

// ─── Helpers ──────────────────────────────────────────────

/**
 * Pure function to compute bundle pricing from items and discount percent.
 */
function computeBundlePrice(
  items: BundleItem[],
  discountPercent: number
): BundlePriceInfo {
  const originalPriceInCents = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const savingsInCents = Math.round(
    (originalPriceInCents * discountPercent) / 100
  );
  const bundlePriceInCents = originalPriceInCents - savingsInCents;

  return {
    originalPriceInCents,
    bundlePriceInCents,
    savingsInCents,
    discountPercent,
  };
}
