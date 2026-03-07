import { test, expect } from "@playwright/test";

test.describe("Product Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products listing and click the first product to get a valid
    // product detail URL, making the test resilient to seed data changes.
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();

    await page.waitForURL(/\/products\/.+/);
  });

  test("should display the product name as an h1 heading", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText!.length).toBeGreaterThan(0);
  });

  test("should display the product price", async ({ page }) => {
    // Prices are formatted as $X.XX
    await expect(page.locator("text=/\\$\\d+\\.\\d{2}/").first()).toBeVisible();
  });

  test("should display an 'Add to Cart' button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
  });

  test("should display a 'Buy Now' button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /buy now/i })
    ).toBeVisible();
  });

  test("should display stock status", async ({ page }) => {
    // Either "In Stock" or "Out of Stock" should appear
    const inStock = page.getByText(/in stock/i);
    const outOfStock = page.getByText(/out of stock/i);
    const stockVisible =
      (await inStock.count()) > 0 || (await outOfStock.count()) > 0;
    expect(stockVisible).toBe(true);
  });

  test("should display breadcrumbs with Home and Products links", async ({
    page,
  }) => {
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Products" })
    ).toBeVisible();
  });

  test("should display quantity selector", async ({ page }) => {
    await expect(page.getByText("Quantity")).toBeVisible();
  });

  test("should display Description and Reviews tabs", async ({ page }) => {
    await expect(
      page.getByRole("tab", { name: "Description" })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Reviews/ })
    ).toBeVisible();
  });

  test("should switch to Description tab and show content", async ({
    page,
  }) => {
    const descriptionTab = page.getByRole("tab", { name: "Description" });
    await descriptionTab.click();

    // The description tab content should be visible (some text in the tab panel)
    const tabPanel = page.locator('[role="tabpanel"]');
    await expect(tabPanel).toBeVisible();
  });

  test("should display trust icons for shipping, payment, and returns", async ({
    page,
  }) => {
    await expect(page.getByText("Free Shipping")).toBeVisible();
    await expect(page.getByText("Secure Payment")).toBeVisible();
    await expect(page.getByText("30-Day Returns")).toBeVisible();
  });

  test("should have a compare button", async ({ page }) => {
    // The compare button has an aria-label containing "comparison"
    const compareButton = page.getByRole("button", {
      name: /comparison/i,
    });
    await expect(compareButton).toBeVisible();
  });

  test("should display product image gallery area", async ({ page }) => {
    // The image gallery section is the first column of the product grid.
    // It contains either an img element or a placeholder.
    const imageArea = page.locator(".lg\\:grid-cols-2 > :first-child");
    await expect(imageArea).toBeVisible();
  });

  test("should include the product name in the page title", async ({
    page,
  }) => {
    const title = await page.title();
    expect(title).toContain("Amazone");
    // Title should not be a generic fallback
    expect(title).not.toBe("Amazone");
  });
});
