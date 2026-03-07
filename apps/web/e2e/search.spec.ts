import { test, expect } from "@playwright/test";

test.describe("Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display a search input on the homepage", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await expect(searchInput.first()).toBeVisible();
  });

  test("should accept text input in the search bar", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.first().fill("headphones");
    await expect(searchInput.first()).toHaveValue("headphones");
  });

  test("should navigate to search results page on form submit", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.first().fill("keyboard");
    await searchInput.first().press("Enter");

    await page.waitForURL(/\/search\?q=keyboard/);
    await expect(page).toHaveURL(/\/search\?q=keyboard/);
  });

  test("should display results heading with query on search results page", async ({
    page,
  }) => {
    await page.goto("/search?q=headphones");

    await expect(
      page.getByRole("heading", { name: /Search results for/ })
    ).toBeVisible();
    await expect(page.getByText(/headphones/)).toBeVisible();
  });

  test("should show result count badge for valid queries", async ({
    page,
  }) => {
    await page.goto("/search?q=headphones");

    await expect(page.getByText(/\d+ results?/)).toBeVisible();
  });

  test("should display 'No results found' for non-existent search term", async ({
    page,
  }) => {
    await page.goto("/search?q=xyznonexistentproduct123");

    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("should show helpful links when no results are found", async ({
    page,
  }) => {
    await page.goto("/search?q=xyznonexistentproduct123");

    await expect(
      page.getByRole("link", { name: "Browse Categories" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "All Products" })
    ).toBeVisible();
  });

  test("should display default state when no query is provided", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(
      page.getByText("Enter a search term to find products")
    ).toBeVisible();
  });

  test("should navigate to product page when clicking a search result", async ({
    page,
  }) => {
    await page.goto("/search?q=headphones");

    // Wait for at least one product link to appear in results
    const productLink = page
      .locator('a[href*="/products/"]')
      .first();
    await expect(productLink).toBeVisible();

    await productLink.click();
    await page.waitForURL(/\/products\//);
    await expect(page).toHaveURL(/\/products\//);
  });

  test("should show correct page title on search page", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page).toHaveTitle(/Search/);
  });
});
