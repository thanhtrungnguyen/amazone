import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage before importing the store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_index: number) => null),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

import { useWishlistStore } from "../wishlist-store";

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    productId: "prod-1",
    name: "Wireless Headphones",
    slug: "wireless-headphones",
    price: 4999,
    image: "https://example.com/img.jpg",
    ...overrides,
  };
}

describe("useWishlistStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWishlistStore.setState({ items: [] });
    localStorageMock.clear();
  });

  describe("addItem", () => {
    it("adds a product to the wishlist", () => {
      useWishlistStore.getState().addItem(makeProduct());

      const items = useWishlistStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("prod-1");
      expect(items[0].name).toBe("Wireless Headphones");
    });

    it("sets addedAt date when adding an item", () => {
      const before = new Date();
      useWishlistStore.getState().addItem(makeProduct());
      const after = new Date();

      const addedAt = useWishlistStore.getState().items[0].addedAt;
      expect(addedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(addedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("does not add duplicate products", () => {
      useWishlistStore.getState().addItem(makeProduct());
      useWishlistStore.getState().addItem(makeProduct());

      expect(useWishlistStore.getState().items).toHaveLength(1);
    });

    it("adds different products independently", () => {
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-1" }));
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-2", name: "Keyboard" }));

      expect(useWishlistStore.getState().items).toHaveLength(2);
    });
  });

  describe("removeItem", () => {
    it("removes a product by productId", () => {
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-1" }));
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-2" }));

      useWishlistStore.getState().removeItem("prod-1");

      const items = useWishlistStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("prod-2");
    });

    it("does nothing when removing a non-existent product", () => {
      useWishlistStore.getState().addItem(makeProduct());

      useWishlistStore.getState().removeItem("non-existent");

      expect(useWishlistStore.getState().items).toHaveLength(1);
    });
  });

  describe("isInWishlist", () => {
    it("returns true for a product in the wishlist", () => {
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-1" }));

      expect(useWishlistStore.getState().isInWishlist("prod-1")).toBe(true);
    });

    it("returns false for a product not in the wishlist", () => {
      expect(useWishlistStore.getState().isInWishlist("prod-99")).toBe(false);
    });

    it("returns false after a product is removed", () => {
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-1" }));
      useWishlistStore.getState().removeItem("prod-1");

      expect(useWishlistStore.getState().isInWishlist("prod-1")).toBe(false);
    });
  });

  describe("clearWishlist", () => {
    it("removes all items from the wishlist", () => {
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-1" }));
      useWishlistStore.getState().addItem(makeProduct({ productId: "prod-2" }));

      useWishlistStore.getState().clearWishlist();

      expect(useWishlistStore.getState().items).toHaveLength(0);
    });

    it("does nothing on an already empty wishlist", () => {
      useWishlistStore.getState().clearWishlist();
      expect(useWishlistStore.getState().items).toHaveLength(0);
    });
  });
});
