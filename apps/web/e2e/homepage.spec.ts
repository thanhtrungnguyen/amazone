import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Amazone/);
  });

  test('should display the "amazone" logo', async ({ page }) => {
    const logo = page.getByRole("link", { name: "amazone" });
    await expect(logo).toBeVisible();
  });

  test("should have navigation links for Products, Categories, and Deals", async ({
    page,
  }) => {
    // Desktop nav links inside the header
    const productsLink = page.getByRole("link", { name: "Products" }).first();
    const categoriesLink = page
      .getByRole("link", { name: "Categories" })
      .first();
    const dealsLink = page.getByRole("link", { name: "Deals" }).first();

    await expect(productsLink).toBeVisible();
    await expect(categoriesLink).toBeVisible();
    await expect(dealsLink).toBeVisible();
  });

  test("should display search form that accepts input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("headphones");
    await expect(searchInput).toHaveValue("headphones");
  });

  test("should submit search form and navigate to search results", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.fill("keyboard");
    await searchInput.press("Enter");

    await page.waitForURL(/\/search\?q=keyboard/);
    await expect(page).toHaveURL(/\/search\?q=keyboard/);
  });

  test("should display category cards", async ({ page }) => {
    await expect(page.getByText("Shop by Category")).toBeVisible();
    await expect(page.getByText("Electronics")).toBeVisible();
    await expect(page.getByText("Clothing")).toBeVisible();
    await expect(page.getByText("Home & Kitchen")).toBeVisible();
    await expect(page.getByText("Books")).toBeVisible();
    await expect(page.getByText("Sports & Outdoors")).toBeVisible();
    await expect(page.getByText("Toys & Games")).toBeVisible();
  });

  test("should display trust badges section", async ({ page }) => {
    await expect(page.getByText("Free Shipping")).toBeVisible();
    await expect(page.getByText("Easy Returns")).toBeVisible();
    await expect(page.getByText("24/7 Support")).toBeVisible();
  });

  test("should display featured products section", async ({ page }) => {
    await expect(page.getByText("Featured Products")).toBeVisible();
    // At least one product card should be visible (placeholder data)
    await expect(
      page.getByText("Premium Wireless Headphones").first()
    ).toBeVisible();
  });

  test("should display hero section with CTA buttons", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Amazone"
    );
    await expect(
      page.getByText("A full-featured e-commerce platform")
    ).toBeVisible();

    const browseBtn = page.getByRole("link", { name: "Browse Products" });
    const dashboardBtn = page.getByRole("link", { name: "Seller Dashboard" });
    await expect(browseBtn).toBeVisible();
    await expect(dashboardBtn).toBeVisible();
  });

  test("should display domain packages grid", async ({ page }) => {
    await expect(page.getByText("Domain Packages")).toBeVisible();
    await expect(page.getByText("Cart & Checkout")).toBeVisible();
    await expect(page.getByText("Product Catalog")).toBeVisible();
    await expect(page.getByText("Payments")).toBeVisible();
    await expect(page.getByText("Reviews & Ratings")).toBeVisible();
  });

  test("should display tech stack badges", async ({ page }) => {
    await expect(page.getByText("Tech Stack")).toBeVisible();
    await expect(page.getByText("Next.js 16", { exact: true })).toBeVisible();
    await expect(page.getByText("React 19", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Drizzle ORM", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Stripe", { exact: true })).toBeVisible();
  });

  test("should display deals promo banner", async ({ page }) => {
    await expect(page.getByText("Today's Deals")).toBeVisible();
    const shopDealsLink = page.getByRole("link", { name: "Shop Deals" });
    await expect(shopDealsLink).toBeVisible();
  });
});

test.describe("Homepage - Responsive", () => {
  test("should render correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Products" })
    ).toBeVisible();

    // Trust badges should still render on mobile
    await expect(page.getByText("Free Shipping")).toBeVisible();
  });
});
