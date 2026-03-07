"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/stores/wishlist-store";

/**
 * Hydrates the Zustand wishlist store from the database when a user is logged in.
 * Mirrors the CartHydrator pattern — place in root layout inside Providers.
 */
export function WishlistHydrator(): null {
  const { status } = useSession();
  const hydrate = useWishlistStore((s) => s.hydrate);
  const isHydrated = useWishlistStore((s) => s.isHydrated);

  useEffect(() => {
    if (status === "authenticated" && !isHydrated) {
      hydrate();
    }
  }, [status, isHydrated, hydrate]);

  useEffect(() => {
    if (status === "unauthenticated") {
      useWishlistStore.setState({ isHydrated: false, items: [] });
    }
  }, [status]);

  return null;
}
