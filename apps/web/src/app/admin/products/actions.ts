"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { db, products } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update product status" };
  }
}

export async function toggleProductFeatured(
  productId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { db, products } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(products)
      .set({ isFeatured, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update product featured status" };
  }
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export async function bulkDeleteProducts(
  ids: string[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  try {
    const { db, products } = await import("@amazone/db");
    const { inArray } = await import("drizzle-orm");

    await db.delete(products).where(inArray(products.id, ids));

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete products" };
  }
}

export async function bulkSetProductStatus(
  ids: string[],
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  try {
    const { db, products } = await import("@amazone/db");
    const { inArray } = await import("drizzle-orm");

    await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(inArray(products.id, ids));

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update product statuses" };
  }
}

export interface ExportedProduct {
  id: string;
  name: string;
  seller: string;
  category: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface ExportProductsResult {
  success: boolean;
  csv?: string;
  error?: string;
}

export async function exportProductsCSV(
  ids: string[]
): Promise<ExportProductsResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (ids.length === 0) {
    return { success: false, error: "No products selected" };
  }

  try {
    const { db, products, users, categories } = await import("@amazone/db");
    const { inArray, eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        seller: users.name,
        category: categories.name,
        priceCents: products.price,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(inArray(products.id, ids));

    // Build CSV — escape values that might contain commas or quotes
    function escapeCSV(value: string | number | boolean | null): string {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const header = [
      "ID",
      "Name",
      "Seller",
      "Category",
      "Price (cents)",
      "Stock",
      "Active",
      "Featured",
      "Created At",
    ].join(",");

    const body = rows
      .map((r) =>
        [
          escapeCSV(r.id),
          escapeCSV(r.name),
          escapeCSV(r.seller),
          escapeCSV(r.category ?? "Uncategorized"),
          escapeCSV(r.priceCents),
          escapeCSV(r.stock),
          escapeCSV(r.isActive),
          escapeCSV(r.isFeatured),
          escapeCSV(r.createdAt.toISOString()),
        ].join(",")
      )
      .join("\n");

    return { success: true, csv: `${header}\n${body}` };
  } catch {
    return { success: false, error: "Failed to export products" };
  }
}
