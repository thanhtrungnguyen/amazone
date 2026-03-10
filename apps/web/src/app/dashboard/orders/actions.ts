"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateOrderStatus } from "@amazone/orders";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@amazone/shared-utils";

/**
 * Server action for sellers/admins to update an order's fulfillment status.
 * Verifies the caller is a seller who owns products in the order, or an admin.
 *
 * When transitioning to "shipped", accepts optional tracking number and carrier name
 * which get stored in the order event metadata.
 */

const shippingMetadataSchema = z.object({
  trackingNumber: z.string().min(1).max(100).optional(),
  carrierName: z.string().min(1).max(100).optional(),
});

export async function updateSellerOrderStatus(
  orderId: string,
  status: string,
  shippingInfo?: { trackingNumber?: string; carrierName?: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    return { success: false, error: "Unauthorized" };
  }

  const isAdmin = session.user.role === "admin";

  try {
    const { db, orderItems, products } = await import("@amazone/db");
    const { eq, and } = await import("drizzle-orm");

    // For sellers, verify they own at least one product in this order
    if (!isAdmin) {
      const sellerItems = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(orderItems.orderId, orderId),
            eq(products.sellerId, session.user.id)
          )
        )
        .limit(1);

      if (sellerItems.length === 0) {
        return { success: false, error: "You do not have products in this order" };
      }
    }

    // Build metadata for the event (only for "shipped" with tracking info)
    let metadata: Record<string, unknown> | null = null;
    if (status === "shipped" && shippingInfo) {
      const parsed = shippingMetadataSchema.safeParse(shippingInfo);
      if (parsed.success) {
        const meta: Record<string, unknown> = {};
        if (parsed.data.trackingNumber) {
          meta.trackingNumber = parsed.data.trackingNumber;
        }
        if (parsed.data.carrierName) {
          meta.carrierName = parsed.data.carrierName;
        }
        if (Object.keys(meta).length > 0) {
          metadata = meta;
        }
      }
    }

    const result = await updateOrderStatus(
      orderId,
      { status: status as OrderStatus },
      metadata
    );

    if (!result) {
      return { success: false, error: "Order not found" };
    }

    revalidatePath("/dashboard/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}
