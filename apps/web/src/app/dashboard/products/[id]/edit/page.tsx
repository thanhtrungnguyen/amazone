import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { EditProductForm } from "./edit-product-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const { getProduct } = await import("@amazone/products");
    const product = await getProduct(id);
    return {
      title: product
        ? `Edit ${product.name} — Amazone Dashboard`
        : "Product Not Found — Amazone Dashboard",
    };
  } catch {
    return { title: "Edit Product — Amazone Dashboard" };
  }
}

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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user?.id ||
    !["seller", "admin"].includes(session.user.role ?? "")
  ) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const { getProduct } = await import("@amazone/products");
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Verify the seller owns this product (admins can edit any)
  if (session.user.role !== "admin" && product.sellerId !== session.user.id) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        images: product.images,
      }}
      categories={categories}
    />
  );
}
