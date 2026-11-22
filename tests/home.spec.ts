import { expect, test } from "@playwright/test";

test("home provides character-first navigation on desktop and phone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find your next build." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Choose a character" })).toHaveAttribute("href", "/characters");
  await expect(page.getByRole("link", { name: "Ragna", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent posts" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByText("Menu", { exact: true }).click();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Browse" })).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(375);
});
