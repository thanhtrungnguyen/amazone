"use client";

import { create } from "zustand";
import { toast } from "sonner";

const MAX_COMPARE_ITEMS = 4;

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
}

interface CompareStore {
  items: CompareItem[];

  addProduct: (item: CompareItem) => void;
  removeProduct: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  items: [],

  addProduct: (item) => {
    const { items } = get();

    if (items.some((i) => i.id === item.id)) {
      toast.info(`"${item.name}" is already in your comparison list`);
      return;
    }

    if (items.length >= MAX_COMPARE_ITEMS) {
      toast.error(
        `You can compare up to ${MAX_COMPARE_ITEMS} products. Remove one to add another.`
      );
      return;
    }

    set({ items: [...items, item] });
    toast.success(`"${item.name}" added to comparison`);
  },

  removeProduct: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  clear: () => {
    set({ items: [] });
  },

  isInCompare: (id) => get().items.some((i) => i.id === id),
}));
