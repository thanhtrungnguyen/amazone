"use server";

import { db, cartItems, savedForLater } from "@amazone/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// ─── Zod Schemas ──────────────────────────────────────────

const moveToSavedSchema = z.object({
  userId: z.string().uuid(),
  cartItemId: z.string().uuid(),
});

const moveToCartSchema = z.object({
  userId: z.string().uuid(),
  savedItemId: z.string().uuid(),
});

const removeSavedSchema = z.object({
  userId: z.string().uuid(),
  savedItemId: z.string().uuid(),
});

const getSavedSchema = z.object({
  userId: z.string().uuid(),
});

// ─── Types ────────────────────────────────────────────────

export interface SavedForLaterItem {
  id: string;
  quantity: number;
  variantId: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[] | null;
    stock: number;
  };
}

// ─── Actions ──────────────────────────────────────────────

/**
 * Move a cart item to the "Saved for Later" list.
 * Removes the item from the cart and inserts it into saved_for_later.
 * If the item already exists in saved_for_later, quantity is updated.
 */
export async function moveToSavedForLater(
  userId: string,
  cartItemId: string
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const parsed = moveToSavedSchema.safeParse({ userId, cartItemId });
  if (!parsed.success) {
    return { success: false, error: "errors.validation.invalid_input" };
  }

  try {
    // 1. Find the cart item and verify ownership
    const cartItem = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)),
    });

    if (!cartItem) {
      return { success: false, error: "errors.cart.item_not_found" };
    }

    // 2. Check if already saved (same product + variant)
    const existingConditions = [
      eq(savedForLater.userId, userId),
      eq(savedForLater.productId, cartItem.productId),
    ];
    if (cartItem.variantId) {
      existingConditions.push(eq(savedForLater.variantId, cartItem.variantId));
    }

    const existing = await db.query.savedForLater.findFirst({
      where: and(...existingConditions),
    });

    let savedId: string;

    if (existing) {
      // Update quantity on existing saved item
      const [updated] = await db
        .update(savedForLater)
        .set({ quantity: existing.quantity + cartItem.quantity })
        .where(eq(savedForLater.id, existing.id))
        .returning({ id: savedForLater.id });
      savedId = updated.id;
    } else {
      // Insert new saved item
      const [inserted] = await db
        .insert(savedForLater)
        .values({
          userId,
          productId: cartItem.productId,
          variantId: cartItem.variantId ?? null,
          quantity: cartItem.quantity,
        })
        .returning({ id: savedForLater.id });
      savedId = inserted.id;
    }

    // 3. Remove from cart
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));

    return { success: true, data: { id: savedId } };
  } catch (error) {
    console.error("[moveToSavedForLater]", { userId, cartItemId, error });
    return { success: false, error: "errors.saved_for_later.move_failed" };
  }
}

/**
 * Move a saved item back to the cart.
 * Removes from saved_for_later and inserts/updates in cart_items.
 */
export async function moveToCart(
  userId: string,
  savedItemId: string
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const parsed = moveToCartSchema.safeParse({ userId, savedItemId });
  if (!parsed.success) {
    return { success: false, error: "errors.validation.invalid_input" };
  }

  try {
    // 1. Find the saved item and verify ownership
    const savedItem = await db.query.savedForLater.findFirst({
      where: and(
        eq(savedForLater.id, savedItemId),
        eq(savedForLater.userId, userId)
      ),
    });

    if (!savedItem) {
      return { success: false, error: "errors.saved_for_later.item_not_found" };
    }

    // 2. Check if already in cart (same product + variant)
    const cartConditions = [
      eq(cartItems.userId, userId),
      eq(cartItems.productId, savedItem.productId),
    ];
    if (savedItem.variantId) {
      cartConditions.push(eq(cartItems.variantId, savedItem.variantId));
    }

    const existingCartItem = await db.query.cartItems.findFirst({
      where: and(...cartConditions),
    });

    let cartItemId: string;

    if (existingCartItem) {
      // Cap at 99 per business rule
      const newQuantity = Math.min(
        existingCartItem.quantity + savedItem.quantity,
        99
      );
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existingCartItem.id))
        .returning({ id: cartItems.id });
      cartItemId = updated.id;
    } else {
      const [inserted] = await db
        .insert(cartItems)
        .values({
          userId,
          productId: savedItem.productId,
          variantId: savedItem.variantId ?? null,
          quantity: Math.min(savedItem.quantity, 99),
        })
        .returning({ id: cartItems.id });
      cartItemId = inserted.id;
    }

    // 3. Remove from saved
    await db
      .delete(savedForLater)
      .where(
        and(
          eq(savedForLater.id, savedItemId),
          eq(savedForLater.userId, userId)
        )
      );

    return { success: true, data: { id: cartItemId } };
  } catch (error) {
    console.error("[moveToCart]", { userId, savedItemId, error });
    return { success: false, error: "errors.saved_for_later.move_to_cart_failed" };
  }
}

/**
 * Get all saved-for-later items for a user, with product details.
 */
export async function getSavedForLater(
  userId: string
): Promise<
  { success: true; data: SavedForLaterItem[] } | { success: false; error: string }
> {
  const parsed = getSavedSchema.safeParse({ userId });
  if (!parsed.success) {
    return { success: false, error: "errors.validation.invalid_input" };
  }

  try {
    const items = await db.query.savedForLater.findMany({
      where: eq(savedForLater.userId, userId),
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
      },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: item.product.images as string[] | null,
          stock: item.product.stock,
        },
      })),
    };
  } catch (error) {
    console.error("[getSavedForLater]", { userId, error });
    return { success: false, error: "errors.saved_for_later.fetch_failed" };
  }
}

/**
 * Remove an item from the saved-for-later list.
 */
export async function removeSavedItem(
  userId: string,
  savedItemId: string
): Promise<{ success: true; data: null } | { success: false; error: string }> {
  const parsed = removeSavedSchema.safeParse({ userId, savedItemId });
  if (!parsed.success) {
    return { success: false, error: "errors.validation.invalid_input" };
  }

  try {
    const [deleted] = await db
      .delete(savedForLater)
      .where(
        and(
          eq(savedForLater.id, savedItemId),
          eq(savedForLater.userId, userId)
        )
      )
      .returning({ id: savedForLater.id });

    if (!deleted) {
      return { success: false, error: "errors.saved_for_later.item_not_found" };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("[removeSavedItem]", { userId, savedItemId, error });
    return { success: false, error: "errors.saved_for_later.remove_failed" };
  }
}
