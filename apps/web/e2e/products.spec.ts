import { test, expect } from "@playwright/test";

test.describe("Products Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("should load the products page with correct title", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Products/);
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  });

  test("should display product cards in a grid", async ({ page }) => {
    // Placeholder data always includes these products
    await expect(
      page.getByText("Premium Wireless Headphones").first()
    ).toBeVisible();
    await expect(
      page.getByText("Mechanical Gaming Keyboard").first()
    ).toBeVisible();
    await expect(
      page.getByText("Organic Cotton T-Shirt").first()
    ).toBeVisible();
  });

  test("should show product count", async ({ page }) => {
    // Placeholder data has 8 products
    await expect(page.getByText(/\d+ products? found/)).toBeVisible();
  });

  test("should display category filter badges", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "All" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Electronics" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Clothing" }).first()
    ).toBeVisible();
  });

  test("should have a sort dropdown", async ({ page }) => {
    // The select trigger with "Sort by" or default value "Newest"
    const sortTrigger = page.getByRole("combobox");
    await expect(sortTrigger).toBeVisible();
  });

  test("should have a search input on the products page", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await expect(searchInput.first()).toBeVisible();
  });

  test("should navigate to product detail when clicking a product card", async ({
    page,
  }) => {
    // Click on the first product link that matches a known placeholder slug
    const productLink = page
      .getByRole("link", { name: /Premium Wireless Headphones/i })
      .first();
    await productLink.click();

    await page.waitForURL(/\/products\/premium-wireless-headphones/);
    await expect(page).toHaveURL(/\/products\/premium-wireless-headphones/);
  });

  test("should filter products by search query via URL", async ({ page }) => {
    await page.goto("/products?search=keyboard");
    await expect(
      page.getByText("Mechanical Gaming Keyboard").first()
    ).toBeVisible();
    await expect(page.getByText(/for "keyboard"/)).toBeVisible();
  });
});

test.describe("Product Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/premium-wireless-headphones");
  });

  test("should display product name", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Premium Wireless Headphones" })
    ).toBeVisible();
  });

  test("should display product price", async ({ page }) => {
    // Price is $99.99 (9999 cents)
    await expect(page.getByText("$99.99")).toBeVisible();
  });

  test("should display add-to-cart button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
  });

  test("should display stock status", async ({ page }) => {
    await expect(page.getByText(/in stock/i)).toBeVisible();
  });

  test("should have description and reviews tabs", async ({ page }) => {
    await expect(
      page.getByRole("tab", { name: "Description" })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Reviews/ })
    ).toBeVisible();
  });

  test("should display product description in the description tab", async ({
    page,
  }) => {
    const descriptionTab = page.getByRole("tab", { name: "Description" });
    await descriptionTab.click();
    await expect(
      page.getByText(/crystal-clear audio/i)
    ).toBeVisible();
  });

  test("should display discount badge when product is on sale", async ({
    page,
  }) => {
    // Premium Wireless Headphones has compareAtPrice of $149.99
    await expect(page.getByText("$149.99")).toBeVisible();
    await expect(page.getByText(/Save \d+%/)).toBeVisible();
  });

  test("should display shipping and return trust icons", async ({ page }) => {
    await expect(page.getByText("Free Shipping")).toBeVisible();
    await expect(page.getByText("Secure Payment")).toBeVisible();
    await expect(page.getByText("30-Day Returns")).toBeVisible();
  });

  test("should have correct page title with product name", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/Premium Wireless Headphones/);
  });
});

test.describe("Search Results", () => {
  test("should display results for a valid query", async ({ page }) => {
    await page.goto("/search?q=headphones");
    await expect(
      page.getByRole("heading", { name: /Search results for/ })
    ).toBeVisible();
    await expect(page.getByText(/\d+ results?/)).toBeVisible();
  });

  test("should show empty state when no results match", async ({ page }) => {
    await page.goto("/search?q=xyznonexistent");
    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("should show default search page when no query is provided", async ({
    page,
  }) => {
    await page.goto("/search");
    await expect(
      page.getByText("Enter a search term to find products")
    ).toBeVisible();
  });
});
