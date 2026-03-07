import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock server actions before importing the store — the module path must match
// the import used in cart-store.ts.
vi.mock("@/app/(shop)/cart/actions", () => ({
  syncAddToCart: vi.fn().mockResolvedValue({ success: true, data: { id: "db-id" } }),
  syncRemoveFromCart: vi.fn().mockResolvedValue({ success: true, data: null }),
  syncUpdateCartItem: vi.fn().mockResolvedValue({ success: true, data: null }),
  syncGetCart: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalItems: 0, totalInCents: 0 } }),
  syncClearCart: vi.fn().mockResolvedValue({ success: true, data: null }),
}));

import { useCartStore } from "../cart-store";

function makeItem(overrides: Partial<{ id: string; productId: string; name: string; price: number; image: string | null; quantity: number }> = {}) {
  return {
    id: "item-1",
    productId: "prod-1",
    name: "Wireless Headphones",
    price: 4999,
    image: "https://example.com/img.jpg",
    ...overrides,
  };
}

describe("useCartStore", () => {
  beforeEach(() => {
    // Reset store state before each test — keep isHydrated false so
    // no background server action calls are triggered during unit tests.
    useCartStore.setState({
      items: [],
      isOpen: false,
      isHydrated: false,
      isSyncing: false,
    });
  });

  describe("addItem", () => {
    it("adds a new item to an empty cart with default quantity of 1", () => {
      useCartStore.getState().addItem(makeItem());

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe("prod-1");
      expect(items[0].quantity).toBe(1);
    });

    it("adds a new item with a specified quantity", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 3 }));

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it("increments quantity when adding a product that already exists", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().addItem(makeItem());

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("increments by specified quantity for existing product", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 2 }));
      useCartStore.getState().addItem(makeItem({ quantity: 3 }));

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it("adds multiple different products as separate items", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1", productId: "prod-1" }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2", name: "Keyboard" }));

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
    });

    it("clamps quantity to a maximum of 99", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 150 }));

      const items = useCartStore.getState().items;
      expect(items[0].quantity).toBe(99);
    });
  });

  describe("removeItem", () => {
    it("removes an item by its id", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1" }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2" }));

      useCartStore.getState().removeItem("item-1");

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("item-2");
    });

    it("does nothing when removing a non-existent id", () => {
      useCartStore.getState().addItem(makeItem());

      useCartStore.getState().removeItem("non-existent");

      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe("updateQuantity", () => {
    it("updates the quantity of an existing item", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1" }));

      useCartStore.getState().updateQuantity("item-1", 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("removes the item when quantity is set to 0", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1" }));

      useCartStore.getState().updateQuantity("item-1", 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes the item when quantity is set to a negative number", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1" }));

      useCartStore.getState().updateQuantity("item-1", -1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("does not affect other items when updating one", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1", productId: "prod-1" }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2", price: 1000 }));

      useCartStore.getState().updateQuantity("item-1", 10);

      expect(useCartStore.getState().items[0].quantity).toBe(10);
      expect(useCartStore.getState().items[1].quantity).toBe(1);
    });

    it("clamps quantity to a maximum of 99", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1" }));

      useCartStore.getState().updateQuantity("item-1", 200);

      expect(useCartStore.getState().items[0].quantity).toBe(99);
    });
  });

  describe("clear", () => {
    it("removes all items from the cart", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1", productId: "prod-1" }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2" }));

      useCartStore.getState().clear();

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("does nothing on an already empty cart", () => {
      useCartStore.getState().clear();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("totalItems", () => {
    it("returns 0 for an empty cart", () => {
      expect(useCartStore.getState().totalItems()).toBe(0);
    });

    it("sums up quantities across all items", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1", productId: "prod-1", quantity: 2 }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2", quantity: 3 }));

      expect(useCartStore.getState().totalItems()).toBe(5);
    });
  });

  describe("totalPrice", () => {
    it("returns 0 for an empty cart", () => {
      expect(useCartStore.getState().totalPrice()).toBe(0);
    });

    it("calculates total price in cents correctly", () => {
      useCartStore.getState().addItem(makeItem({ id: "item-1", productId: "prod-1", price: 1000, quantity: 2 }));
      useCartStore.getState().addItem(makeItem({ id: "item-2", productId: "prod-2", price: 2500, quantity: 1 }));

      // 1000*2 + 2500*1 = 4500 cents
      expect(useCartStore.getState().totalPrice()).toBe(4500);
    });
  });

  describe("drawer state", () => {
    it("starts closed", () => {
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it("opens the cart drawer", () => {
      useCartStore.getState().open();
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it("closes the cart drawer", () => {
      useCartStore.getState().open();
      useCartStore.getState().close();
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it("toggles the cart drawer", () => {
      useCartStore.getState().toggle();
      expect(useCartStore.getState().isOpen).toBe(true);
      useCartStore.getState().toggle();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });

  describe("hydration state", () => {
    it("starts not hydrated", () => {
      expect(useCartStore.getState().isHydrated).toBe(false);
    });

    it("starts not syncing", () => {
      expect(useCartStore.getState().isSyncing).toBe(false);
    });
  });
});
