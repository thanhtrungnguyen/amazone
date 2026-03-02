import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the hero section", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Amazone"
    );
    await expect(
      page.getByText("A full-featured e-commerce platform")
    ).toBeVisible();
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
    await expect(
      page.getByText("Next.js 16", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("React 19", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Drizzle ORM", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Stripe", { exact: true })
    ).toBeVisible();
  });

  test("should have CTA buttons", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Browse Products" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Seller Dashboard" })
    ).toBeVisible();
  });

  test("should have proper page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Amazone/);
  });

  test("should display footer", async ({ page }) => {
    await expect(page.getByText("pnpm nx dev web")).toBeVisible();
  });
});

test.describe("Responsive", () => {
  test("should render on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Browse Products" })
    ).toBeVisible();
  });
});
