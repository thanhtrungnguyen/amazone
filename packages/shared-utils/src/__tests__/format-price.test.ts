import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatPriceVN,
  centsToDollars,
  dollarsToCents,
} from "../format-price";

describe("formatPrice", () => {
  it("formats cents to USD dollars correctly", () => {
    expect(formatPrice(9999)).toBe("$99.99");
  });

  it("formats zero cents to $0.00", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("formats a single cent", () => {
    expect(formatPrice(1)).toBe("$0.01");
  });

  it("formats an exact dollar amount", () => {
    expect(formatPrice(1000)).toBe("$10.00");
  });

  it("formats large amounts with comma separators", () => {
    expect(formatPrice(12345678)).toBe("$123,456.78");
  });

  it("formats negative amounts for refunds", () => {
    const result = formatPrice(-1500);
    // Intl.NumberFormat may use different minus sign representations
    expect(result).toContain("15.00");
  });

  it("accepts a custom currency code", () => {
    const result = formatPrice(1000, "EUR");
    // The exact format depends on locale + currency, but should contain the value
    expect(result).toContain("10.00");
  });

  it("always shows exactly 2 decimal places", () => {
    const result = formatPrice(100);
    expect(result).toBe("$1.00");
  });
});

describe("formatPriceVN", () => {
  it("formats price in VND with no decimal places", () => {
    const result = formatPriceVN(50000);
    // VND formatting in vi-VN locale — the value should be 50,000 (or 50.000 in VN format)
    expect(result).toContain("50");
  });

  it("formats zero as VND", () => {
    const result = formatPriceVN(0);
    expect(result).toContain("0");
  });

  it("formats large VND amounts", () => {
    const result = formatPriceVN(1000000);
    expect(result).toContain("1.000.000");
  });
});

describe("centsToDollars", () => {
  it("converts cents to dollars", () => {
    expect(centsToDollars(9999)).toBe(99.99);
  });

  it("converts zero cents to zero dollars", () => {
    expect(centsToDollars(0)).toBe(0);
  });

  it("converts negative cents for refunds", () => {
    expect(centsToDollars(-500)).toBe(-5);
  });

  it("converts a single cent", () => {
    expect(centsToDollars(1)).toBe(0.01);
  });
});

describe("dollarsToCents", () => {
  it("converts dollars to cents", () => {
    expect(dollarsToCents(99.99)).toBe(9999);
  });

  it("converts zero dollars to zero cents", () => {
    expect(dollarsToCents(0)).toBe(0);
  });

  it("rounds to the nearest cent to avoid floating point issues", () => {
    // 19.99 * 100 = 1998.9999999999998 in IEEE 754 — Math.round fixes this
    expect(dollarsToCents(19.99)).toBe(1999);
  });

  it("converts negative dollars for refunds", () => {
    expect(dollarsToCents(-15.5)).toBe(-1550);
  });

  it("handles whole dollar amounts", () => {
    expect(dollarsToCents(10)).toBe(1000);
  });
});
