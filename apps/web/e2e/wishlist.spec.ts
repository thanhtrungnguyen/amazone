import { test, expect } from "@playwright/test";

test.describe("Wishlist", () => {
  test("should display empty wishlist state", async ({ page }) => {
    await page.goto("/wishlist");

    await expect(
      page.getByRole("heading", { name: "Your Wishlist" })
    ).toBeVisible();
    await expect(page.getByText("Your wishlist is empty")).toBeVisible();
  });

  test("should show Browse Products link when wishlist is empty", async ({
    page,
  }) => {
    await page.goto("/wishlist");

    await expect(
      page.getByRole("link", { name: "Browse Products" })
    ).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/wishlist");

    await expect(page).toHaveTitle(/Wishlist/);
  });

  test("should display wishlist icon in the site header", async ({ page }) => {
    await page.goto("/");

    // The header has a wishlist link with Heart icon and sr-only text
    const wishlistLink = page.getByRole("link", { name: /wishlist/i });
    await expect(wishlistLink).toBeVisible();
  });

  test("should navigate to wishlist page from header icon", async ({
    page,
  }) => {
    await page.goto("/");

    const wishlistLink = page.getByRole("link", { name: /wishlist/i });
    await wishlistLink.click();

    await page.waitForURL(/\/wishlist/);
    await expect(page).toHaveURL(/\/wishlist/);
    await expect(
      page.getByRole("heading", { name: "Your Wishlist" })
    ).toBeVisible();
  });

  test("should show helpful description text on empty wishlist", async ({
    page,
  }) => {
    await page.goto("/wishlist");

    await expect(
      page.getByText(/save items you love/i)
    ).toBeVisible();
  });

  test("should navigate to products from empty wishlist Browse Products link", async ({
    page,
  }) => {
    await page.goto("/wishlist");

    const browseLink = page.getByRole("link", { name: "Browse Products" });
    await browseLink.click();

    await page.waitForURL(/\/products/);
    await expect(page).toHaveURL(/\/products/);
  });
});
