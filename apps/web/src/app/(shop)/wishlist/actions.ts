"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db, wishlists } from "@amazone/db";
import { eq, and } from "drizzle-orm";

interface ActionResult<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: string;
}

type ActionResponse<T> = ActionResult<T> | ActionError;

export interface WishlistDbItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  createdAt: Date;
}

export async function syncGetWishlist(): Promise<
  ActionResponse<WishlistDbItem[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const items = await db.query.wishlists.findMany({
      where: eq(wishlists.userId, session.user.id),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: (w, { desc }) => [desc(w.createdAt)],
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        image: item.product.images?.[0] ?? null,
        createdAt: item.createdAt,
      })),
    };
  } catch {
    return { success: false, error: "Failed to fetch wishlist" };
  }
}

export async function syncAddToWishlist(
  productId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const [item] = await db
      .insert(wishlists)
      .values({ userId: session.user.id, productId })
      .onConflictDoNothing()
      .returning({ id: wishlists.id });

    // If conflict (already exists), fetch the existing record
    if (!item) {
      const existing = await db.query.wishlists.findFirst({
        where: and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId)
        ),
      });
      return { success: true, data: { id: existing?.id ?? productId } };
    }

    revalidatePath("/wishlist");
    return { success: true, data: { id: item.id } };
  } catch {
    return { success: false, error: "Failed to add to wishlist" };
  }
}

export async function syncRemoveFromWishlist(
  productId: string
): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId)
        )
      );

    revalidatePath("/wishlist");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to remove from wishlist" };
  }
}

export async function syncClearWishlist(): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db.delete(wishlists).where(eq(wishlists.userId, session.user.id));

    revalidatePath("/wishlist");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to clear wishlist" };
  }
}
