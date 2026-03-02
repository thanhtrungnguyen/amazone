import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should load the homepage without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("should not have any accessibility violations in headings hierarchy", async ({
    page,
  }) => {
    await page.goto("/");

    const headings = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .allTextContents();

    // Ensure there's exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Ensure headings exist
    expect(headings.length).toBeGreaterThan(0);
  });

  test("should have no broken images", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});
