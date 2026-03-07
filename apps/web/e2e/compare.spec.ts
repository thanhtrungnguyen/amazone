import { test, expect } from "@playwright/test";

test.describe("Product Comparison", () => {
  test("should display empty comparison state on the compare page", async ({
    page,
  }) => {
    await page.goto("/compare");

    await expect(
      page.getByRole("heading", { name: "Compare Products" })
    ).toBeVisible();
    await expect(
      page.getByText("No products to compare")
    ).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/compare");

    await expect(page).toHaveTitle(/Compare/);
  });

  test("should show Browse Products link when comparison is empty", async ({
    page,
  }) => {
    await page.goto("/compare");

    await expect(
      page.getByRole("link", { name: "Browse Products" })
    ).toBeVisible();
  });

  test("should display a compare button on the product detail page", async ({
    page,
  }) => {
    // Navigate to first product
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);

    // The compare button exists with an aria-label about comparison
    const compareButton = page.getByRole("button", {
      name: /comparison/i,
    });
    await expect(compareButton).toBeVisible();
  });

  test("should add a product to comparison from product detail page", async ({
    page,
  }) => {
    // Navigate to first product
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);

    // Click compare button
    const compareButton = page.getByRole("button", {
      name: /add .+ to comparison/i,
    });
    await compareButton.click();

    // A toast should confirm addition
    await expect(page.getByText(/added to comparison/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show compare bar after adding two products", async ({
    page,
  }) => {
    // Add first product to comparison
    await page.goto("/products");
    const productLinks = page.locator('a[href*="/products/"]');

    // Click first product
    const firstLink = productLinks.first();
    const firstHref = await firstLink.getAttribute("href");
    await firstLink.click();
    await page.waitForURL(/\/products\/.+/);

    // Add to compare
    const compareBtn1 = page.getByRole("button", {
      name: /add .+ to comparison/i,
    });
    await compareBtn1.click();
    await expect(page.getByText(/added to comparison/i)).toBeVisible({
      timeout: 5000,
    });

    // Navigate back to products and pick a different product
    await page.goto("/products");
    const allLinks = page.locator('a[href*="/products/"]');
    const linkCount = await allLinks.count();

    // Find a different product link
    let secondLink = allLinks.first();
    for (let i = 0; i < linkCount; i++) {
      const href = await allLinks.nth(i).getAttribute("href");
      if (href !== firstHref) {
        secondLink = allLinks.nth(i);
        break;
      }
    }

    await secondLink.click();
    await page.waitForURL(/\/products\/.+/);

    // Add second product to compare
    const compareBtn2 = page.getByRole("button", {
      name: /add .+ to comparison/i,
    });
    await compareBtn2.click();
    await expect(page.getByText(/added to comparison/i).last()).toBeVisible({
      timeout: 5000,
    });

    // The compare bar should now be visible at the bottom
    const compareBar = page.getByRole("region", {
      name: /product comparison bar/i,
    });
    await expect(compareBar).toBeVisible();
    await expect(page.getByText(/Compare \(\d+\)/)).toBeVisible();
  });

  test("should have 'Compare Now' link in the compare bar", async ({
    page,
  }) => {
    // Add two products (simplified: go to compare page directly won't work
    // because the store is client-side; we need to add via product pages)
    await page.goto("/products");
    const productLinks = page.locator('a[href*="/products/"]');
    const firstLink = productLinks.first();
    const firstHref = await firstLink.getAttribute("href");
    await firstLink.click();
    await page.waitForURL(/\/products\/.+/);

    const compareBtn1 = page.getByRole("button", {
      name: /add .+ to comparison/i,
    });
    await compareBtn1.click();
    await page.getByText(/added to comparison/i);

    await page.goto("/products");
    const allLinks = page.locator('a[href*="/products/"]');
    const linkCount = await allLinks.count();
    let secondLink = allLinks.first();
    for (let i = 0; i < linkCount; i++) {
      const href = await allLinks.nth(i).getAttribute("href");
      if (href !== firstHref) {
        secondLink = allLinks.nth(i);
        break;
      }
    }
    await secondLink.click();
    await page.waitForURL(/\/products\/.+/);

    const compareBtn2 = page.getByRole("button", {
      name: /add .+ to comparison/i,
    });
    await compareBtn2.click();

    // Click "Compare Now" in the compare bar
    const compareNowLink = page.getByRole("link", { name: "Compare Now" });
    await expect(compareNowLink).toBeVisible({ timeout: 5000 });
    await compareNowLink.click();

    await page.waitForURL(/\/compare/);
    await expect(page).toHaveURL(/\/compare/);
  });

  test("should display comparison table with product names when items are added", async ({
    page,
  }) => {
    // Add two products then navigate to compare page
    await page.goto("/products");
    const productLinks = page.locator('a[href*="/products/"]');
    const firstLink = productLinks.first();
    const firstHref = await firstLink.getAttribute("href");
    await firstLink.click();
    await page.waitForURL(/\/products\/.+/);

    const productName1 = await page
      .getByRole("heading", { level: 1 })
      .textContent();

    await page.getByRole("button", { name: /add .+ to comparison/i }).click();
    await page.getByText(/added to comparison/i);

    await page.goto("/products");
    const allLinks = page.locator('a[href*="/products/"]');
    const linkCount = await allLinks.count();
    let secondLink = allLinks.first();
    for (let i = 0; i < linkCount; i++) {
      const href = await allLinks.nth(i).getAttribute("href");
      if (href !== firstHref) {
        secondLink = allLinks.nth(i);
        break;
      }
    }
    await secondLink.click();
    await page.waitForURL(/\/products\/.+/);

    const productName2 = await page
      .getByRole("heading", { level: 1 })
      .textContent();

    await page.getByRole("button", { name: /add .+ to comparison/i }).click();

    // Navigate to compare page via the compare bar link
    await page.getByRole("link", { name: "Compare Now" }).click();
    await page.waitForURL(/\/compare/);

    // Should show the comparison table with both product names
    await expect(page.getByText("Comparing")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Both product names should appear in the table
    await expect(page.getByText(productName1!)).toBeVisible();
    await expect(page.getByText(productName2!)).toBeVisible();

    // Table should have Price and Name rows
    await expect(page.getByText("Price").first()).toBeVisible();
    await expect(page.getByText("Name").first()).toBeVisible();
  });
});
