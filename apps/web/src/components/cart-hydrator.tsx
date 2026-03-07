"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";

/**
 * Hydrates the Zustand cart store from the database when a user is logged in.
 * Place this component in the root layout (inside Providers) so it runs once
 * on app mount and whenever the session status changes (e.g., after sign-in).
 *
 * For non-logged-in users the store stays local-only — no DB calls are made.
 */
export function CartHydrator(): null {
  const { status } = useSession();
  const hydrate = useCartStore((s) => s.hydrate);
  const isHydrated = useCartStore((s) => s.isHydrated);

  useEffect(() => {
    if (status === "authenticated" && !isHydrated) {
      hydrate();
    }
  }, [status, isHydrated, hydrate]);

  // Reset hydration flag on sign-out so that a subsequent sign-in
  // with a different account re-fetches the cart.
  useEffect(() => {
    if (status === "unauthenticated") {
      useCartStore.setState({ isHydrated: false, items: [] });
    }
  }, [status]);

  return null;
}
