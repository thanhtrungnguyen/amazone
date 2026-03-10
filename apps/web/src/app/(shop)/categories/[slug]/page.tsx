import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@amazone/shared-ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InfiniteProductGrid } from "@/components/infinite-product-grid";
import { fetchCategoryProductsPage } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category Not Found — Amazone" };
  return {
    title: `${category.name} — Amazone`,
    description: category.description ?? `Browse ${category.name} products.`,
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const { db, categories } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");
    const row = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    return row ?? null;
  } catch {
    return null;
  }
}

const LIMIT = 24;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const { getProductsPaginated } = await import("@amazone/products");

  const firstPage = await getProductsPaginated({
    categoryId: category.id,
    sortBy: "newest",
    limit: LIMIT,
    isActive: true,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Product grid */}
      {firstPage.products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No products in this category yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <Suspense fallback={<ProductGridSkeleton count={LIMIT} />}>
          <InfiniteProductGrid
            initialProducts={firstPage.products}
            initialCursor={firstPage.nextCursor}
            total={firstPage.total}
            fetchNextPage={fetchCategoryProductsPage}
            filterParams={{ categoryId: category.id }}
          />
        </Suspense>
      )}
    </div>
  );
}
