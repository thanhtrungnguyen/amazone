import { describe, it, expect } from "vitest";
import { addToCartSchema, updateCartItemSchema } from "../types";

describe("addToCartSchema", () => {
  it("accepts valid input with productId and quantity", () => {
    const result = addToCartSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe(
        "550e8400-e29b-41d4-a716-446655440000"
      );
      expect(result.data.quantity).toBe(3);
    }
  });

  it("defaults quantity to 1 when omitted", () => {
    const result = addToCartSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejects missing productId", () => {
    const result = addToCartSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID productId", () => {
    const result = addToCartSchema.safeParse({
      productId: "not-a-uuid",
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = addToCartSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = addToCartSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const result = addToCartSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCartItemSchema", () => {
  it("accepts a valid positive integer quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: -3 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 2.5 });
    expect(result.success).toBe(false);
  });

  it("rejects missing quantity", () => {
    const result = updateCartItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
