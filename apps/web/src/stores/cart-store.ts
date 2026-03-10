"use client";

import { create } from "zustand";
import type { CartItemWithProduct } from "@amazone/cart";
import {
  syncAddToCart,
  syncRemoveFromCart,
  syncUpdateCartItem,
  syncGetCart,
  syncClearCart,
} from "@/app/(shop)/cart/actions";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  isSyncing: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;

  totalItems: () => number;
  totalPrice: () => number;
}

/**
 * Map a DB cart item (with nested product) to the flat CartItem shape
 * used by the store and all UI consumers.
 */
function toCartItem(dbItem: CartItemWithProduct): CartItem {
  return {
    id: dbItem.id,
    productId: dbItem.product.id,
    variantId: dbItem.variantId ?? null,
    name: dbItem.product.name,
    price: dbItem.variant?.priceInCents ?? dbItem.product.price,
    image: dbItem.product.images?.[0] ?? null,
    quantity: dbItem.quantity,
  };
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  isHydrated: false,
  isSyncing: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  hydrate: async () => {
    if (get().isHydrated) return;

    set({ isSyncing: true });
    try {
      const result = await syncGetCart();
      if (result.success) {
        set({
          items: result.data.items.map(toCartItem),
          isHydrated: true,
        });
      } else {
        // User not logged in or fetch failed — mark hydrated with current
        // (empty) local state so we don't retry continuously.
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    } finally {
      set({ isSyncing: false });
    }
  },

  refresh: async () => {
    set({ isSyncing: true });
    try {
      const result = await syncGetCart();
      if (result.success) {
        set({ items: result.data.items.map(toCartItem) });
      }
    } catch {
      // Silently fail — existing state remains
    } finally {
      set({ isSyncing: false });
    }
  },

  addItem: (item) => {
    const quantity = item.quantity ?? 1;
    const clampedQuantity = Math.min(quantity, 99);

    // --- Optimistic update ---
    const prevItems = get().items;
    const existing = prevItems.find(
      (i) =>
        i.productId === item.productId &&
        (i.variantId ?? null) === (item.variantId ?? null)
    );

    if (existing) {
      const newQuantity = Math.min(existing.quantity + clampedQuantity, 99);
      set({
        items: prevItems.map((i) =>
          i.productId === item.productId &&
          (i.variantId ?? null) === (item.variantId ?? null)
            ? { ...i, quantity: newQuantity }
            : i
        ),
      });
    } else {
      set({
        items: [...prevItems, { ...item, quantity: clampedQuantity }],
      });
    }

    // --- Background sync ---
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncAddToCart({
        productId: item.productId,
        quantity: clampedQuantity,
        variantId: item.variantId ?? undefined,
      })
        .then((result) => {
          if (result.success) {
            // Replace the temporary client-generated ID with the real DB ID
            // for items that were newly added (not increments of existing).
            if (!existing) {
              set((state) => ({
                items: state.items.map((i) =>
                  i.productId === item.productId &&
                  (i.variantId ?? null) === (item.variantId ?? null) &&
                  i.id === item.id
                    ? { ...i, id: result.data.id }
                    : i
                ),
              }));
            }
          } else {
            // Rollback on failure
            set({ items: prevItems });
          }
        })
        .catch(() => {
          set({ items: prevItems });
        })
        .finally(() => {
          set({ isSyncing: false });
        });
    }
  },

  removeItem: (id) => {
    const prevItems = get().items;

    // --- Optimistic update ---
    set({ items: prevItems.filter((i) => i.id !== id) });

    // --- Background sync ---
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncRemoveFromCart(id)
        .then((result) => {
          if (!result.success) {
            set({ items: prevItems });
          }
        })
        .catch(() => {
          set({ items: prevItems });
        })
        .finally(() => {
          set({ isSyncing: false });
        });
    }
  },

  updateQuantity: (id, quantity) => {
    const prevItems = get().items;
    const clampedQuantity = Math.min(quantity, 99);

    // --- Optimistic update ---
    if (clampedQuantity <= 0) {
      set({ items: prevItems.filter((i) => i.id !== id) });
    } else {
      set({
        items: prevItems.map((i) =>
          i.id === id ? { ...i, quantity: clampedQuantity } : i
        ),
      });
    }

    // --- Background sync ---
    if (get().isHydrated) {
      set({ isSyncing: true });

      const syncAction =
        clampedQuantity <= 0
          ? syncRemoveFromCart(id)
          : syncUpdateCartItem(id, { quantity: clampedQuantity });

      syncAction
        .then((result) => {
          if (!result.success) {
            set({ items: prevItems });
          }
        })
        .catch(() => {
          set({ items: prevItems });
        })
        .finally(() => {
          set({ isSyncing: false });
        });
    }
  },

  clear: () => {
    const prevItems = get().items;

    // --- Optimistic update ---
    set({ items: [] });

    // --- Background sync ---
    if (get().isHydrated) {
      set({ isSyncing: true });
      syncClearCart()
        .then((result) => {
          if (!result.success) {
            set({ items: prevItems });
          }
        })
        .catch(() => {
          set({ items: prevItems });
        })
        .finally(() => {
          set({ isSyncing: false });
        });
    }
  },

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  totalPrice: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
