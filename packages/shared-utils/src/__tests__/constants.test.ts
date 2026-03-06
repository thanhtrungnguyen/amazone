import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  APP_DESCRIPTION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PRODUCT_IMAGE_SIZES,
  ORDER_STATUSES,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  RATING_MIN,
  RATING_MAX,
} from "../constants";

describe("APP constants", () => {
  it("has APP_NAME defined as a non-empty string", () => {
    expect(APP_NAME).toBe("Amazone");
    expect(typeof APP_NAME).toBe("string");
  });

  it("has APP_DESCRIPTION defined as a non-empty string", () => {
    expect(APP_DESCRIPTION).toBeTruthy();
    expect(typeof APP_DESCRIPTION).toBe("string");
  });
});

describe("pagination constants", () => {
  it("has a reasonable DEFAULT_PAGE_SIZE", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("has MAX_PAGE_SIZE greater than DEFAULT_PAGE_SIZE", () => {
    expect(MAX_PAGE_SIZE).toBe(100);
    expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE);
  });
});

describe("PRODUCT_IMAGE_SIZES", () => {
  it("defines thumbnail, card, detail, and full sizes", () => {
    expect(PRODUCT_IMAGE_SIZES).toHaveProperty("thumbnail");
    expect(PRODUCT_IMAGE_SIZES).toHaveProperty("card");
    expect(PRODUCT_IMAGE_SIZES).toHaveProperty("detail");
    expect(PRODUCT_IMAGE_SIZES).toHaveProperty("full");
  });

  it("has width and height for each size", () => {
    for (const size of Object.values(PRODUCT_IMAGE_SIZES)) {
      expect(size).toHaveProperty("width");
      expect(size).toHaveProperty("height");
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
  });

  it("sizes are in ascending order", () => {
    expect(PRODUCT_IMAGE_SIZES.thumbnail.width).toBeLessThan(
      PRODUCT_IMAGE_SIZES.card.width
    );
    expect(PRODUCT_IMAGE_SIZES.card.width).toBeLessThan(
      PRODUCT_IMAGE_SIZES.detail.width
    );
    expect(PRODUCT_IMAGE_SIZES.detail.width).toBeLessThan(
      PRODUCT_IMAGE_SIZES.full.width
    );
  });
});

describe("ORDER_STATUSES", () => {
  it("contains the expected order lifecycle statuses", () => {
    expect(ORDER_STATUSES).toContain("pending");
    expect(ORDER_STATUSES).toContain("confirmed");
    expect(ORDER_STATUSES).toContain("processing");
    expect(ORDER_STATUSES).toContain("shipped");
    expect(ORDER_STATUSES).toContain("delivered");
    expect(ORDER_STATUSES).toContain("cancelled");
    expect(ORDER_STATUSES).toContain("refunded");
  });

  it("has exactly 7 statuses", () => {
    expect(ORDER_STATUSES).toHaveLength(7);
  });
});

describe("locale constants", () => {
  it("supports English and Vietnamese locales", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("vi");
  });

  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("DEFAULT_LOCALE is one of SUPPORTED_LOCALES", () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });
});

describe("rating constants", () => {
  it("has RATING_MIN of 1", () => {
    expect(RATING_MIN).toBe(1);
  });

  it("has RATING_MAX of 5", () => {
    expect(RATING_MAX).toBe(5);
  });

  it("RATING_MIN is less than RATING_MAX", () => {
    expect(RATING_MIN).toBeLessThan(RATING_MAX);
  });
});
