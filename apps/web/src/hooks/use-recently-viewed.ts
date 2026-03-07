"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "amazone:recently-viewed";
const MAX_ITEMS = 20;

interface RecentlyViewedEntry {
  productId: string;
  viewedAt: number;
}

/** Subscribers for useSyncExternalStore */
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getEntries(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentlyViewedEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.productId === "string" &&
        typeof entry.viewedAt === "number"
    );
  } catch {
    return [];
  }
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export interface UseRecentlyViewedReturn {
  productIds: string[];
  addProduct: (productId: string) => void;
  clear: () => void;
}

export function useRecentlyViewed(): UseRecentlyViewedReturn {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const productIds: string[] = (() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (entry): entry is RecentlyViewedEntry =>
            typeof entry === "object" &&
            entry !== null &&
            typeof entry.productId === "string" &&
            typeof entry.viewedAt === "number"
        )
        .map((entry) => entry.productId);
    } catch {
      return [];
    }
  })();

  const addProduct = useCallback((productId: string) => {
    const entries = getEntries();
    const filtered = entries.filter((e) => e.productId !== productId);
    const updated: RecentlyViewedEntry[] = [
      { productId, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitChange();
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitChange();
  }, []);

  return { productIds, addProduct, clear };
}
