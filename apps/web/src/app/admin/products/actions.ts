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
