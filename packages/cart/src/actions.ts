"use server";

import { db, cartItems } from "@amazone/db";
import { eq, and } from "drizzle-orm";
import {
  addToCartSchema,
  updateCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
  type CartSummary,
} from "./types";

export async function addToCart(
  userId: string,
  input: AddToCartInput
): Promise<typeof cartItems.$inferSelect> {
  const validated = addToCartSchema.parse(input);

  // Check if item already exists in cart (match by product + variant)
  const conditions = [
    eq(cartItems.userId, userId),
    eq(cartItems.productId, validated.productId),
  ];

  if (validated.variantId) {
    conditions.push(eq(cartItems.variantId, validated.variantId));
  }

  const existing = await db.query.cartItems.findFirst({
    where: and(...conditions),
  });

  if (existing) {
    const [updated] = await db
      .update(cartItems)
      .set({
        quantity: existing.quantity + validated.quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing.id))
      .returning();
    return updated;
  }

  const [item] = await db
    .insert(cartItems)
    .values({
      userId,
      productId: validated.productId,
      variantId: validated.variantId ?? null,
      quantity: validated.quantity,
    })
    .returning();

  return item;
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<typeof cartItems.$inferSelect | undefined> {
  const validated = updateCartItemSchema.parse(input);

  const [updated] = await db
    .update(cartItems)
    .set({
      quantity: validated.quantity,
      updatedAt: new Date(),
    })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
    .returning();

  return updated;
}

export async function removeFromCart(
  userId: string,
  itemId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
    .returning({ id: cartItems.id });

  return !!deleted;
}

export async function getCart(userId: string): Promise<CartSummary> {
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: {
      product: {
        columns: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          stock: true,
        },
      },
      variant: {
        columns: {
          id: true,
          sku: true,
          priceInCents: true,
          stock: true,
        },
      },
    },
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalInCents = items.reduce((sum, item) => {
    const price = item.variant?.priceInCents ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return {
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
      product: item.product,
      variant: item.variant ?? null,
    })),
    totalItems,
    totalInCents,
  };
}

export async function clearCart(userId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}
