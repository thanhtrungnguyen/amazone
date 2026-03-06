import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amazone.com";

/**
 * Dynamic sitemap that includes static pages plus product and category URLs
 * fetched from the database. Falls back to static-only if DB is unavailable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes that always exist
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/deals`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/sign-up`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Attempt to fetch dynamic routes from the database
  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const { listProducts } = await import("@amazone/products");
    const products = await listProducts({ isActive: true, limit: 1000, sortBy: "newest" });

    productRoutes = products.map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable — skip dynamic product URLs
  }

  try {
    const { db } = await import("@amazone/db");
    const categories = await db.query.categories.findMany();

    categoryRoutes = categories.map((category) => ({
      url: `${BASE_URL}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable — skip dynamic category URLs
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
