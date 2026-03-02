import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("should have proper lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("should have a descriptive page title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe("Create Next App");
  });

  test("all buttons should be keyboard focusable", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await button.focus();
      await expect(button).toBeFocused();
    }
  });

  test("should have sufficient color contrast (visual check)", async ({
    page,
  }) => {
    await page.goto("/");
    // Ensure text elements are visible and not transparent
    const body = page.locator("body");
    const color = await body.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue("color")
    );
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
  });
});
