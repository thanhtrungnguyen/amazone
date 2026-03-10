"use server";

import { db, orders, reviews, users } from "@amazone/db";
import { count, sum, eq, and, desc, lt, notInArray } from "drizzle-orm";
import { cancelOrder, requestReturn } from "@amazone/orders";
import {
  sendOrderCancellationEmail,
  sendReturnRequestEmail,
} from "@/lib/email";
import { logger } from "@amazone/shared-utils";
import type { ActionResult } from "@amazone/orders";

// ── Types ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface UserStats {
  orderCount: number;
  totalSpentInCents: number;
  reviewCount: number;
}

export interface OrderSummary {
  id: string;
  status: string;
  totalInCents: number;
  itemCount: number;
  createdAt: Date;
}

export interface PaginatedOrders {
  orders: OrderSummary[];
  nextCursor: string | null;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  quantity: number;
  priceInCents: number;
}

export interface OrderDetail {
  id: string;
  status: string;
  totalInCents: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingCountry: string;
  shippingZip: string;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDetail[];
}

// ── Queries ────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const [orderCountResult, totalSpentResult, reviewCountResult] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.userId, userId)),
      db
        .select({ value: sum(orders.totalInCents) })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            notInArray(orders.status, ["cancelled", "refunded"]),
          ),
        ),
      db
        .select({ value: count() })
        .from(reviews)
        .where(eq(reviews.userId, userId)),
    ]);

  return {
    orderCount: orderCountResult[0]?.value ?? 0,
    totalSpentInCents: Number(totalSpentResult[0]?.value ?? 0),
    reviewCount: reviewCountResult[0]?.value ?? 0,
  };
}

export async function getUserOrders(
  userId: string,
  cursor?: string,
  limit = 10,
): Promise<PaginatedOrders> {
  // Build conditions: always filter by user
  const conditions = [eq(orders.userId, userId)];

  // For cursor-based pagination, fetch orders older than the cursor
  if (cursor) {
    // Look up the cursor order's createdAt to paginate by date
    const cursorOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, cursor), eq(orders.userId, userId)),
      columns: { createdAt: true },
    });

    if (cursorOrder) {
      conditions.push(lt(orders.createdAt, cursorOrder.createdAt));
    }
  }

  // Fetch one extra to determine if there's a next page
  const rows = await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: desc(orders.createdAt),
    limit: limit + 1,
    with: {
      items: {
        columns: { quantity: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const mappedOrders: OrderSummary[] = pageRows.map((order) => ({
    id: order.id,
    status: order.status,
    totalInCents: order.totalInCents,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
  }));

  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null;

  return { orders: mappedOrders, nextCursor };
}

export async function getOrderDetail(
  userId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  // Type assertion for the joined product data
  const typedItems = order.items as Array<{
    id: string;
    productId: string;
    quantity: number;
    priceInCents: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[] | null;
    } | null;
  }>;

  const items: OrderItemDetail[] = typedItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product?.name ?? "Unknown Product",
    productSlug: item.product?.slug ?? "",
    productImage: item.product?.images?.[0] ?? null,
    quantity: item.quantity,
    priceInCents: item.priceInCents,
  }));

  return {
    id: order.id,
    status: order.status,
    totalInCents: order.totalInCents,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState ?? null,
    shippingCountry: order.shippingCountry,
    shippingZip: order.shippingZip,
    shippingCarrier: order.shippingCarrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
  };
}

// ── Cancel Order (web wrapper — calls domain action + sends email) ──────────

export async function cancelOrderAction(
  userId: string,
  orderId: string
): Promise<ActionResult<{ orderId: string }>> {
  const result = await cancelOrder(orderId, userId);

  if (result.success) {
    // Best-effort email — failures are logged but never surface to the user
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true },
      });

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { totalInCents: true },
      });

      if (user && order) {
        await sendOrderCancellationEmail({
          to: user.email,
          customerName: user.name,
          orderId,
          totalInCents: order.totalInCents,
        });
      }
    } catch (err) {
      logger.error(
        { err, orderId, userId },
        "cancelOrderAction: failed to send cancellation email"
      );
    }
  }

  return result;
}

// ── Request Return (web wrapper — calls domain action + sends email) ─────────

export async function requestReturnAction(
  userId: string,
  orderId: string,
  reason: string
): Promise<ActionResult<{ returnRequestId: string }>> {
  const result = await requestReturn(orderId, userId, reason);

  if (result.success) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true },
      });

      if (user) {
        await sendReturnRequestEmail({
          to: user.email,
          customerName: user.name,
          orderId,
          reason,
          returnRequestId: result.data.returnRequestId,
        });
      }
    } catch (err) {
      logger.error(
        { err, orderId, userId },
        "requestReturnAction: failed to send return request email"
      );
    }
  }

  return result;
}
