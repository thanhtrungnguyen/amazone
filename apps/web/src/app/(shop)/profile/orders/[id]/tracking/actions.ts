"use server";

import { db, orders, orderEvents } from "@amazone/db";
import { eq, and, asc } from "drizzle-orm";
import type { OrderEvent } from "@amazone/orders";

// ── Types ──────────────────────────────────────────────────────────

export interface OrderTrackingData {
  orderId: string;
  status: string;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingCountry: string;
  shippingZip: string;
  createdAt: Date;
  updatedAt: Date;
  events: OrderEvent[];
}

// ── Query ──────────────────────────────────────────────────────────

/**
 * Fetch full order tracking data including all timeline events.
 * Verifies the requesting user owns the order.
 * Returns null if the order does not exist or does not belong to the user.
 */
export async function getOrderTracking(
  orderId: string,
  userId: string,
): Promise<OrderTrackingData | null> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    columns: {
      id: true,
      status: true,
      shippingCarrier: true,
      trackingNumber: true,
      estimatedDelivery: true,
      shippingName: true,
      shippingAddress: true,
      shippingCity: true,
      shippingState: true,
      shippingCountry: true,
      shippingZip: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!order) return null;

  const rawEvents = await db.query.orderEvents.findMany({
    where: eq(orderEvents.orderId, orderId),
    orderBy: asc(orderEvents.createdAt),
  });

  const events: OrderEvent[] = rawEvents.map((e) => ({
    id: e.id,
    orderId: e.orderId,
    type: e.type,
    message: e.message,
    metadata: e.metadata ?? null,
    createdAt: e.createdAt,
  }));

  return {
    orderId: order.id,
    status: order.status,
    shippingCarrier: order.shippingCarrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ?? null,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState ?? null,
    shippingCountry: order.shippingCountry,
    shippingZip: order.shippingZip,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    events,
  };
}
