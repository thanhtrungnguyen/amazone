"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createCategory(
  name: string,
  slug: string,
  parentId?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim().toLowerCase();

  if (!trimmedName || !trimmedSlug) {
    return { success: false, error: "Name and slug are required" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
    return {
      success: false,
      error: "Slug must be lowercase letters, numbers, and hyphens only",
    };
  }

  try {
    const { db, categories } = await import("@amazone/db");

    await db.insert(categories).values({
      name: trimmedName,
      slug: trimmedSlug,
      parentId: parentId || null,
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("unique")
    ) {
      return { success: false, error: "A category with this slug already exists" };
    }
    return { success: false, error: "Failed to create category" };
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { db, categories, products } = await import("@amazone/db");
    const { eq, sql } = await import("drizzle-orm");

    // Check if any products use this category
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    if (result && result.count > 0) {
      return {
        success: false,
        error: `Cannot delete: ${result.count} product(s) are using this category`,
      };
    }

    // Check if any child categories reference this one
    const [childResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (childResult && childResult.count > 0) {
      return {
        success: false,
        error: `Cannot delete: ${childResult.count} child category(ies) reference this category`,
      };
    }

    await db.delete(categories).where(eq(categories.id, categoryId));

    revalidatePath("/admin/categories");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
