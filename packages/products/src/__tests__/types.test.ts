import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "../types";

describe("createProductSchema", () => {
  const validProduct = {
    name: "Wireless Headphones",
    price: 4999,
  };

  it("accepts a valid product with only required fields", () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Wireless Headphones");
      expect(result.data.price).toBe(4999);
      // Defaults
      expect(result.data.stock).toBe(0);
      expect(result.data.isActive).toBe(true);
      expect(result.data.isFeatured).toBe(false);
    }
  });

  it("accepts a fully populated product", () => {
    const full = {
      name: "Wireless Headphones",
      description: "Noise-cancelling Bluetooth headphones",
      price: 4999,
      compareAtPrice: 6999,
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      stock: 150,
      isActive: true,
      isFeatured: true,
    };
    const result = createProductSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const result = createProductSchema.safeParse({ price: 4999 });
    expect(result.success).toBe(false);
  });

  it("rejects when name is empty string", () => {
    const result = createProductSchema.safeParse({ name: "", price: 4999 });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 500 characters", () => {
    const result = createProductSchema.safeParse({
      name: "a".repeat(501),
      price: 4999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when price is missing", () => {
    const result = createProductSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = createProductSchema.safeParse({ name: "Test", price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({ name: "Test", price: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer price (fractional cents)", () => {
    const result = createProductSchema.safeParse({
      name: "Test",
      price: 49.99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = createProductSchema.safeParse({
      name: "Test",
      price: 1000,
      stock: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid categoryId (non-UUID)", () => {
    const result = createProductSchema.safeParse({
      name: "Test",
      price: 1000,
      categoryId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid image URLs", () => {
    const result = createProductSchema.safeParse({
      name: "Test",
      price: 1000,
      images: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer compareAtPrice", () => {
    const result = createProductSchema.safeParse({
      name: "Test",
      price: 1000,
      compareAtPrice: 19.99,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts partial updates (all fields optional)", () => {
    const result = updateProductSchema.safeParse({ price: 5999 });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no fields to update)", () => {
    const result = updateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still validates field types on partial input", () => {
    const result = updateProductSchema.safeParse({ price: -100 });
    expect(result.success).toBe(false);
  });

  it("still validates name max length on partial input", () => {
    const result = updateProductSchema.safeParse({ name: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("productFilterSchema", () => {
  it("accepts empty object and applies defaults", () => {
    const result = productFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe("newest");
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts valid filter with all fields", () => {
    const result = productFilterSchema.safeParse({
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      minPrice: 0,
      maxPrice: 100000,
      search: "headphones",
      isActive: true,
      isFeatured: false,
      sortBy: "price_asc",
      cursor: "550e8400-e29b-41d4-a716-446655440000",
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid sortBy values", () => {
    const validSorts = ["price_asc", "price_desc", "newest", "rating", "name"];
    for (const sortBy of validSorts) {
      const result = productFilterSchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid sortBy value", () => {
    const result = productFilterSchema.safeParse({ sortBy: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = productFilterSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = productFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects negative minPrice", () => {
    const result = productFilterSchema.safeParse({ minPrice: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID categoryId", () => {
    const result = productFilterSchema.safeParse({ categoryId: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID cursor", () => {
    const result = productFilterSchema.safeParse({ cursor: "not-uuid" });
    expect(result.success).toBe(false);
  });
});
