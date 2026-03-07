"use client";

import { create } from "zustand";
import {
  syncGetWishlist,
  syncAddToWishlist,
  syncRemoveFromWishlist,
  syncClearWishlist,
} from "@/app/(shop)/wishlist/actions";

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  addedAt: Date;
}

interface WishlistStore {
  items: WishlistItem[];
  isHydrated: boolean;
  isSyncing: boolean;

  addItem: (product: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  hydrate: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isHydrated: false,
  isSyncing: false,

  hydrate: async () => {
    if (get().isHydrated) return;

    set({ isSyncing: true });
    try {
      const result = await syncGetWishlist();
      if (result.success) {
        set({
          items: result.data.map((item) => ({
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            price: item.price,
            image: item.image,
            addedAt: new Date(item.createdAt),
          })),
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    } finally {
      set({ isSyncing: false });
    }
  },

  addItem: (product) => {
    if (get().items.some((i) => i.productId === product.productId)) return;

    const prevItems = get().items;
    const newItem: WishlistItem = { ...product, addedAt: new Date() };

    // Optimistic update
    set({ items: [...prevItems, newItem] });

    // Background sync
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncAddToWishlist(product.productId)
        .then((result) => {
          if (!result.success) set({ items: prevItems });
        })
        .catch(() => set({ items: prevItems }))
        .finally(() => set({ isSyncing: false }));
    }
  },

  removeItem: (productId) => {
    const prevItems = get().items;

    // Optimistic update
    set({ items: prevItems.filter((i) => i.productId !== productId) });

    // Background sync
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncRemoveFromWishlist(productId)
        .then((result) => {
          if (!result.success) set({ items: prevItems });
        })
        .catch(() => set({ items: prevItems }))
        .finally(() => set({ isSyncing: false }));
    }
  },

  isInWishlist: (productId) =>
    get().items.some((i) => i.productId === productId),

  clearWishlist: () => {
    const prevItems = get().items;

    // Optimistic update
    set({ items: [] });

    // Background sync
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncClearWishlist()
        .then((result) => {
          if (!result.success) set({ items: prevItems });
        })
        .catch(() => set({ items: prevItems }))
        .finally(() => set({ isSyncing: false }));
    }
  },
}));
