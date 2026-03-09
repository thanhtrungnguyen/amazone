"use server";

import { db, orders, orderItems, products, returnRequests } from "@amazone/db";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { logger } from "@amazone/shared-utils";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  requestReturnSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type ActionResult,
} from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Orders may be cancelled within this window after creation (milliseconds). */
const CANCEL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Return requests must be submitted within this window after delivery (milliseconds). */
const RETURN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Statuses that are already past the point where customer cancellation is allowed. */
const NON_CANCELLABLE_STATUSES = new Set([
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "return_requested",
] as const);

// ─── Create / Read ───────────────────────────────────────────────────────────

export async function createOrder(
  userId: string,
  input: CreateOrderInput,
  items: { productId: string; quantity: number; priceInCents: number }[]
): Promise<typeof orders.$inferSelect> {
  const validated = createOrderSchema.parse(input);
  const totalInCents = items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        ...validated,
        totalInCents,
      })
      .returning();

    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceInCents: item.priceInCents,
      }))
    );

    return order;
  });
}

export async function getOrder(
  orderId: string,
  userId: string
): Promise<typeof orders.$inferSelect | undefined> {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: {
      items: {
        with: {
          product: {
            columns: { id: true, name: true, slug: true, images: true },
          },
        },
      },
    },
  });
}

export async function listOrders(
  userId: string,
  limit = 20,
  cursor?: string
): Promise<(typeof orders.$inferSelect)[]> {
  const conditions = [eq(orders.userId, userId)];

  if (cursor) {
    conditions.push(lt(orders.createdAt, new Date(cursor)));
  }

  return db.query.orders.findMany({
    where: and(...conditions),
    orderBy: desc(orders.createdAt),
    limit,
    with: {
      items: {
        with: {
          product: {
            columns: { id: true, name: true, slug: true, images: true },
          },
        },
      },
    },
  });
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<typeof orders.$inferSelect | undefined> {
  const validated = updateOrderStatusSchema.parse(input);

  const [order] = await db
    .update(orders)
    .set({
      status: validated.status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return order;
}

// ─── Cancel Order ────────────────────────────────────────────────────────────

/**
 * Cancel an order on behalf of a customer.
 *
 * Rules:
 * - The order must belong to the given user.
 * - The order must be in "pending" or "processing" status.
 *   ("confirmed" is also cancellable — it has not left the warehouse yet.)
 * - The order must have been created within the last hour OR still be "pending".
 *   (A "pending" order has not been confirmed by payment yet, so it can always
 *    be cancelled regardless of age.)
 * - Stock is restored for every order item inside the same transaction.
 */
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<ActionResult<{ orderId: string }>> {
  const parsed = cancelOrderSchema.safeParse({ orderId, userId });
  if (!parsed.success) {
    return { success: false, error: "errors.invalid_input" };
  }

  try {
    return await db.transaction(async (tx) => {
      // Fetch the order with its items in one query
      const order = await tx.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
        with: {
          items: {
            columns: { productId: true, quantity: true },
          },
        },
      });

      if (!order) {
        return { success: false, error: "errors.order_not_found" };
      }

      // Guard: already in a terminal or post-dispatch state
      if (NON_CANCELLABLE_STATUSES.has(order.status as never)) {
        if (order.status === "cancelled") {
          return { success: false, error: "errors.order_already_cancelled" };
        }
        if (order.status === "shipped" || order.status === "delivered") {
          return { success: false, error: "errors.order_already_shipped" };
        }
        return { success: false, error: "errors.order_cannot_be_cancelled" };
      }

      // Time-window guard: pending orders are always cancellable;
      // confirmed/processing orders must be within the 1-hour window.
      if (order.status !== "pending") {
        const ageMs = Date.now() - order.createdAt.getTime();
        if (ageMs > CANCEL_WINDOW_MS) {
          return { success: false, error: "errors.cancel_window_expired" };
        }
      }

      // Restore stock for each item
      for (const item of order.items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // Mark the order cancelled
      await tx
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      logger.info(
        { orderId, userId, itemCount: order.items.length },
        "Order cancelled — stock restored"
      );

      return { success: true, data: { orderId } };
    });
  } catch (err) {
    logger.error({ err, orderId, userId }, "cancelOrder: unexpected error");
    return { success: false, error: "errors.server_error" };
  }
}

// ─── Request Return ──────────────────────────────────────────────────────────

/**
 * Submit a return request for a delivered order.
 *
 * Rules:
 * - The order must belong to the given user.
 * - The order must have status "delivered".
 * - A return request must be submitted within 30 days of the last status update
 *   (used as a proxy for delivery date since we do not store a separate
 *    delivered_at timestamp).
 * - Only one return request per order is allowed (enforced by DB unique constraint).
 */
export async function requestReturn(
  orderId: string,
  userId: string,
  reason: string
): Promise<ActionResult<{ returnRequestId: string }>> {
  const parsed = requestReturnSchema.safeParse({ orderId, userId, reason });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    // Return the message directly if it looks like a translation key,
    // otherwise fall back to a generic key.
    const error =
      firstIssue?.message.startsWith("errors.")
        ? firstIssue.message
        : "errors.invalid_input";
    return { success: false, error };
  }

  try {
    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
        columns: { id: true, status: true, updatedAt: true },
      });

      if (!order) {
        return { success: false, error: "errors.order_not_found" };
      }

      if (order.status !== "delivered") {
        return { success: false, error: "errors.order_not_delivered" };
      }

      // 30-day window measured from the last status update (delivery timestamp proxy)
      const ageMs = Date.now() - order.updatedAt.getTime();
      if (ageMs > RETURN_WINDOW_MS) {
        return { success: false, error: "errors.return_window_expired" };
      }

      // Check for an existing return request
      const existing = await tx.query.returnRequests.findFirst({
        where: eq(returnRequests.orderId, orderId),
        columns: { id: true },
      });

      if (existing) {
        return { success: false, error: "errors.return_already_requested" };
      }

      // Create the return request record
      const [returnRequest] = await tx
        .insert(returnRequests)
        .values({
          orderId,
          userId,
          reason: parsed.data.reason,
        })
        .returning({ id: returnRequests.id });

      // Update order status to reflect the pending return
      await tx
        .update(orders)
        .set({ status: "return_requested", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      logger.info(
        { orderId, userId, returnRequestId: returnRequest.id },
        "Return request created"
      );

      return { success: true, data: { returnRequestId: returnRequest.id } };
    });
  } catch (err) {
    logger.error({ err, orderId, userId }, "requestReturn: unexpected error");
    return { success: false, error: "errors.server_error" };
  }
}
