import { ProductForm } from "./product-form";

export const metadata = {
  title: "New Product — Amazone Dashboard",
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getCategories(): Promise<Category[]> {
  try {
    const { db, categories } = await import("@amazone/db");
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);
    return rows;
  } catch {
    return [];
  }
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return <ProductForm categories={categories} />;
}
