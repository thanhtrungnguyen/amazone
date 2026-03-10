"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addToCart,
  removeFromCart,
  updateCartItem,
  getCart,
  clearCart,
  type CartSummary,
} from "@amazone/cart";

interface ActionResult<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: string;
}

type ActionResponse<T> = ActionResult<T> | ActionError;

export async function syncAddToCart(input: {
  productId: string;
  quantity: number;
  variantId?: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    const item = await addToCart(session.user.id, input);
    revalidatePath("/cart");
    return { success: true, data: { id: item.id } };
  } catch (error) {
    console.error("[syncAddToCart]", { input, error });
    return { success: false, error: "errors.cart.addFailed" };
  }
}

export async function syncRemoveFromCart(
  itemId: string
): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    await removeFromCart(session.user.id, itemId);
    revalidatePath("/cart");
    return { success: true, data: null };
  } catch (error) {
    console.error("[syncRemoveFromCart]", { itemId, error });
    return { success: false, error: "errors.cart.removeFailed" };
  }
}

export async function syncUpdateCartItem(
  itemId: string,
  input: { quantity: number }
): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    await updateCartItem(session.user.id, itemId, input);
    revalidatePath("/cart");
    return { success: true, data: null };
  } catch (error) {
    console.error("[syncUpdateCartItem]", { itemId, input, error });
    return { success: false, error: "errors.cart.updateFailed" };
  }
}

export async function syncGetCart(): Promise<ActionResponse<CartSummary>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    const cart = await getCart(session.user.id);
    return { success: true, data: cart };
  } catch (error) {
    console.error("[syncGetCart]", { error });
    return { success: false, error: "errors.cart.fetchFailed" };
  }
}

export async function syncClearCart(): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    await clearCart(session.user.id);
    revalidatePath("/cart");
    return { success: true, data: null };
  } catch (error) {
    console.error("[syncClearCart]", { error });
    return { success: false, error: "errors.cart.clearFailed" };
  }
}
