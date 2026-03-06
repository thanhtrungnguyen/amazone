import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@amazone/shared-ui";

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

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
}

const placeholderCategories: Record<string, Category> = {
  electronics: {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Smartphones, laptops, audio, and more",
  },
  clothing: {
    id: "2",
    name: "Clothing",
    slug: "clothing",
    description: "Men's, women's, and kids' fashion",
  },
  "home-kitchen": {
    id: "3",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Furniture, appliances, and decor",
  },
};

const placeholderProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 9999,
    compareAtPrice: 12999,
    images: null,
    avgRating: 450,
    reviewCount: 128,
  },
  {
    id: "2",
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    price: 7999,
    compareAtPrice: null,
    images: null,
    avgRating: 470,
    reviewCount: 312,
  },
  {
    id: "3",
    name: "USB-C Fast Charger",
    slug: "usb-c-fast-charger",
    price: 2499,
    compareAtPrice: 3499,
    images: null,
    avgRating: 440,
    reviewCount: 89,
  },
  {
    id: "4",
    name: "Bluetooth Portable Speaker",
    slug: "bluetooth-portable-speaker",
    price: 3999,
    compareAtPrice: null,
    images: null,
    avgRating: 430,
    reviewCount: 245,
  },
];

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const { db, categories } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");
    const row = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    return row ?? null;
  } catch {
    return placeholderCategories[slug] ?? null;
  }
}

async function getCategoryProducts(
  categoryId: string
): Promise<Product[]> {
  try {
    const { listProducts } = await import("@amazone/products");
    const products = await listProducts({
      categoryId,
      sortBy: "newest",
      limit: 24,
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    }));
  } catch {
    return placeholderProducts;
  }
}

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

  const products = await getCategoryProducts(category.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Categories
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <Badge variant="secondary">{products.length} products</Badge>
        </div>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No products in this category yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              slug={product.slug}
              priceInCents={product.price}
              compareAtPriceInCents={product.compareAtPrice ?? undefined}
              image={product.images?.[0] ?? null}
              rating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
