"use server";

import { db, orders, orderItems } from "@amazone/db";
import { eq, and, desc, lt } from "drizzle-orm";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
} from "./types";

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
