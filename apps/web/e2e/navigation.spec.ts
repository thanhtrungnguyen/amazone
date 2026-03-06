import { test, expect } from "@playwright/test";

test.describe("Navigation - Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to Products page via nav link", async ({ page }) => {
    // Use the nav link (not the CTA button)
    const navLink = page
      .locator("nav")
      .getByRole("link", { name: "Products" });
    await navLink.click();

    await page.waitForURL(/\/products/);
    await expect(page).toHaveURL(/\/products/);
    await expect(
      page.getByRole("heading", { name: "Products" })
    ).toBeVisible();
  });

  test("should navigate to Categories page via nav link", async ({ page }) => {
    const navLink = page
      .locator("nav")
      .getByRole("link", { name: "Categories" });
    await navLink.click();

    await page.waitForURL(/\/categories/);
    await expect(page).toHaveURL(/\/categories/);
    await expect(
      page.getByRole("heading", { name: "Categories" })
    ).toBeVisible();
  });

  test("should navigate to Deals page via nav link", async ({ page }) => {
    const navLink = page.locator("nav").getByRole("link", { name: "Deals" });
    await navLink.click();

    await page.waitForURL(/\/deals/);
    await expect(page).toHaveURL(/\/deals/);
    await expect(
      page.getByRole("heading", { name: /Deals/i }).first()
    ).toBeVisible();
  });

  test("should have cart icon in the header", async ({ page }) => {
    const cartButton = page.getByRole("button", { name: /cart/i });
    await expect(cartButton).toBeVisible();
  });

  test("should have wishlist icon in the header", async ({ page }) => {
    const wishlistLink = page.getByRole("link", { name: /wishlist/i });
    await expect(wishlistLink).toBeVisible();
  });

  test("should navigate home when clicking the logo", async ({ page }) => {
    // Navigate away from homepage first
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);

    const logo = page.getByRole("link", { name: "amazone" });
    await logo.click();

    await page.waitForURL("/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("should load homepage without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("should have exactly one h1 heading on the homepage", async ({
    page,
  }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });
});

test.describe("Navigation - Categories Page", () => {
  test("should display category cards with links", async ({ page }) => {
    await page.goto("/categories");

    await expect(page.getByText("Electronics")).toBeVisible();
    await expect(page.getByText("Clothing")).toBeVisible();
    await expect(page.getByText("Home & Kitchen")).toBeVisible();
    await expect(page.getByText("Books")).toBeVisible();
  });

  test("should navigate to a specific category page", async ({ page }) => {
    await page.goto("/categories");

    const electronicsLink = page
      .getByRole("link", { name: /Electronics/i })
      .first();
    await electronicsLink.click();

    await page.waitForURL(/\/categories\/electronics/);
    await expect(page).toHaveURL(/\/categories\/electronics/);
  });
});

test.describe("Navigation - Deals Page", () => {
  test("should display deal of the day section", async ({ page }) => {
    await page.goto("/deals");

    await expect(page.getByText("Deal of the Day")).toBeVisible();
  });

  test("should display lightning deals section", async ({ page }) => {
    await page.goto("/deals");

    await expect(page.getByText("Lightning Deals")).toBeVisible();
  });

  test("should display products on sale section", async ({ page }) => {
    await page.goto("/deals");

    await expect(page.getByText("Products on Sale")).toBeVisible();
  });
});

test.describe("Navigation - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show mobile menu button on small viewport", async ({
    page,
  }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
  });

  test("should open mobile menu and display nav links", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /menu/i });
    await menuButton.click();

    // Wait for the slide-out sheet to appear
    const sheet = page.locator("[data-state='open']");
    await expect(sheet.first()).toBeVisible();

    // Nav links inside the mobile menu
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Products" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Categories" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Deals" }).first()
    ).toBeVisible();
  });

  test("should navigate from mobile menu to Products page", async ({
    page,
  }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /menu/i });
    await menuButton.click();

    // Click the Products link inside the sheet
    const productsLink = page.getByRole("link", { name: "Products" }).first();
    await productsLink.click();

    await page.waitForURL(/\/products/);
    await expect(page).toHaveURL(/\/products/);
  });

  test("should hide desktop nav links on mobile", async ({ page }) => {
    await page.goto("/");

    // The desktop nav element should be hidden via md:flex class
    const desktopNav = page.locator("nav.hidden");
    // It exists in DOM but is not visible
    await expect(desktopNav.first()).toBeHidden();
  });
});

test.describe("Navigation - Cross-Page Links", () => {
  test("should navigate from homepage Browse Products to products page", async ({
    page,
  }) => {
    await page.goto("/");

    const browseLink = page.getByRole("link", { name: "Browse Products" });
    await browseLink.click();

    await page.waitForURL(/\/products/);
    await expect(page).toHaveURL(/\/products/);
  });

  test("should navigate from homepage Shop Deals to deals page", async ({
    page,
  }) => {
    await page.goto("/");

    const dealsLink = page.getByRole("link", { name: "Shop Deals" });
    await dealsLink.click();

    await page.waitForURL(/\/deals/);
    await expect(page).toHaveURL(/\/deals/);
  });

  test("should navigate from homepage All Categories to categories page", async ({
    page,
  }) => {
    await page.goto("/");

    const categoriesLink = page
      .getByRole("link", { name: "All Categories" })
      .first();
    await categoriesLink.click();

    await page.waitForURL(/\/categories/);
    await expect(page).toHaveURL(/\/categories/);
  });

  test("should navigate from homepage View All to products page", async ({
    page,
  }) => {
    const viewAllLink = page.getByRole("link", { name: "View All" }).first();
    await viewAllLink.click();

    await page.waitForURL(/\/products/);
    await expect(page).toHaveURL(/\/products/);
  });
});
