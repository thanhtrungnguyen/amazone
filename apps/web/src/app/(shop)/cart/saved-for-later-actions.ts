"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  moveToSavedForLater,
  moveToCart,
  getSavedForLater,
  removeSavedItem,
  type SavedForLaterItem,
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

export async function syncMoveToSavedForLater(
  cartItemId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    const result = await moveToSavedForLater(session.user.id, cartItemId);
    if (!result.success) {
      return result;
    }

    revalidatePath("/cart");
    return result;
  } catch (error) {
    console.error("[syncMoveToSavedForLater]", { cartItemId, error });
    return { success: false, error: "errors.saved_for_later.move_failed" };
  }
}

export async function syncMoveToCart(
  savedItemId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    const result = await moveToCart(session.user.id, savedItemId);
    if (!result.success) {
      return result;
    }

    revalidatePath("/cart");
    return result;
  } catch (error) {
    console.error("[syncMoveToCart]", { savedItemId, error });
    return { success: false, error: "errors.saved_for_later.move_to_cart_failed" };
  }
}

export async function syncGetSavedForLater(): Promise<
  ActionResponse<SavedForLaterItem[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    return await getSavedForLater(session.user.id);
  } catch (error) {
    console.error("[syncGetSavedForLater]", { error });
    return { success: false, error: "errors.saved_for_later.fetch_failed" };
  }
}

export async function syncRemoveSavedItem(
  savedItemId: string
): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.auth.unauthenticated" };
    }

    const result = await removeSavedItem(session.user.id, savedItemId);
    if (!result.success) {
      return result;
    }

    revalidatePath("/cart");
    return result;
  } catch (error) {
    console.error("[syncRemoveSavedItem]", { savedItemId, error });
    return { success: false, error: "errors.saved_for_later.remove_failed" };
  }
}
