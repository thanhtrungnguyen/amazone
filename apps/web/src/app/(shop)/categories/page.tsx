import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers } from "lucide-react";

export const metadata = {
  title: "Categories — Amazone",
  description: "Browse products by category.",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

const placeholderCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Smartphones, laptops, audio, and more",
    productCount: 156,
  },
  {
    id: "2",
    name: "Clothing",
    slug: "clothing",
    description: "Men's, women's, and kids' fashion",
    productCount: 423,
  },
  {
    id: "3",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Furniture, appliances, and decor",
    productCount: 289,
  },
  {
    id: "4",
    name: "Books",
    slug: "books",
    description: "Fiction, non-fiction, textbooks, and audiobooks",
    productCount: 1_024,
  },
  {
    id: "5",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Fitness, camping, and outdoor gear",
    productCount: 178,
  },
  {
    id: "6",
    name: "Toys & Games",
    slug: "toys-games",
    description: "Board games, puzzles, action figures, and more",
    productCount: 312,
  },
];

async function getCategories(): Promise<Category[]> {
  try {
    const { db, categories } = await import("@amazone/db");
    const { sql } = await import("drizzle-orm");
    const { products } = await import("@amazone/db");

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, sql`${products.categoryId} = ${categories.id}`)
      .groupBy(categories.id)
      .orderBy(categories.name);

    return rows;
  } catch {
    return placeholderCategories;
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">
          Browse our full catalog by category.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount} product
                    {category.productCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardHeader>
              {category.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
