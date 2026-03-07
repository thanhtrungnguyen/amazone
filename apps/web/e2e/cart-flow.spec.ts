import { test, expect } from "@playwright/test";

test.describe("Cart Flow", () => {
  test("should show empty cart state initially", async ({ page }) => {
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { name: "Shopping Cart" })
    ).toBeVisible();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Products" })
    ).toBeVisible();
  });

  test("should add a product to the cart from product detail page", async ({
    page,
  }) => {
    // Navigate to the first product
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);

    // Click "Add to Cart"
    const addButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Verify the success feedback (button text changes to "Added!" or toast)
    await expect(
      page.getByText(/added/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show cart badge count after adding an item", async ({
    page,
  }) => {
    // Navigate to a product and add it to cart
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);

    const addButton = page.getByRole("button", { name: /add to cart/i });
    await addButton.click();

    // The cart button in the header should now show a badge
    // The sr-only text updates to "Cart (X items)"
    await expect(page.getByText(/Cart \([1-9]\d* items?\)/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display added product on the cart page", async ({ page }) => {
    // Add product to cart
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);

    // Capture product name
    const productName = await page
      .getByRole("heading", { level: 1 })
      .textContent();

    const addButton = page.getByRole("button", { name: /add to cart/i });
    await addButton.click();

    // Wait for add confirmation
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    // Navigate to cart page
    await page.goto("/cart");

    // The product name should appear in the cart
    await expect(page.getByText(productName!)).toBeVisible();
  });

  test("should display Order Summary with subtotal on cart page", async ({
    page,
  }) => {
    // Add a product first
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    await expect(page.getByText("Order Summary")).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Total")).toBeVisible();
    await expect(page.getByText("Shipping")).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
  });

  test("should have Proceed to Checkout link on cart page", async ({
    page,
  }) => {
    // Add a product first
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    await expect(
      page.getByRole("link", { name: /proceed to checkout/i })
    ).toBeVisible();
  });

  test("should increment item quantity in cart", async ({ page }) => {
    // Add product to cart
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    // Find the increase quantity button
    const increaseButton = page
      .getByRole("button", { name: /increase quantity/i })
      .first();
    await expect(increaseButton).toBeVisible();

    // Get initial quantity text
    const quantityLabel = page.getByLabel(/quantity/i).first();
    await expect(quantityLabel).toHaveText("1");

    // Click increment
    await increaseButton.click();

    // Verify quantity changed to 2
    await expect(quantityLabel).toHaveText("2");
  });

  test("should remove item from cart", async ({ page }) => {
    // Add product to cart
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    // Click remove button
    const removeButton = page
      .getByRole("button", { name: /remove/i })
      .first();
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Cart should now be empty
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("should clear all items from cart", async ({ page }) => {
    // Add product to cart
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    // Click "Clear cart" button
    const clearButton = page.getByRole("button", { name: /clear cart/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Cart should now be empty
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("should have a Continue Shopping link on cart page", async ({
    page,
  }) => {
    // Add product so cart is not empty
    await page.goto("/products");
    const firstProductLink = page
      .locator('a[href*="/products/"]')
      .first();
    await firstProductLink.click();
    await page.waitForURL(/\/products\/.+/);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/cart");

    await expect(
      page.getByRole("link", { name: "Continue Shopping" })
    ).toBeVisible();
  });

  test("should display cart breadcrumbs", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByText("Cart")).toBeVisible();
  });
});
