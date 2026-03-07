"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProduct, updateProduct, deleteProduct } from "@amazone/products";
import type { UpdateProductInput } from "@amazone/products";

/**
 * Resolve the sellerId to use for domain actions.
 * Regular sellers use their own id; admins look up the product's actual sellerId
 * so the WHERE clause in domain actions matches correctly.
 */
async function resolveSellerId(
  productId: string,
  userId: string,
  role: string
): Promise<string | null> {
  if (role !== "admin") return userId;

  const product = await getProduct(productId);
  if (!product) return null;
  return product.sellerId;
}

export async function updateSellerProduct(
  productId: string,
  input: UpdateProductInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sellerId = await resolveSellerId(productId, session.user.id, session.user.role ?? "");
    if (!sellerId) {
      return { success: false, error: "Product not found." };
    }

    const product = await updateProduct(productId, sellerId, input);

    if (!product) {
      return { success: false, error: "Product not found or you do not own it." };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return { success: false, error: message };
  }
}

export async function deleteSellerProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sellerId = await resolveSellerId(productId, session.user.id, session.user.role ?? "");
    if (!sellerId) {
      return { success: false, error: "Product not found." };
    }

    const deleted = await deleteProduct(productId, sellerId);

    if (!deleted) {
      return { success: false, error: "Product not found or you do not own it." };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete product.";
    return { success: false, error: message };
  }

  redirect("/dashboard/products");
}
