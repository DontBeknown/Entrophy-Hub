import { expect, test } from "@playwright/test";

test("browse restores query and filters after visiting a post", async ({ page }) => {
  await page.goto("/browse?q=launcher&character=ragna&type=combo");
  await page.getByRole("link", { name: /Corner launcher route/ }).click();
  await expect(page.getByRole("heading", { name: "Input sequence" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("searchbox")).toHaveValue("launcher");
  await page.goto("/browse?q=launcher&character=noel&type=combo");
  await page.getByRole("link", { name: "Clear filters" }).last().click();
  await expect(page).toHaveURL(/\/browse\?q=launcher$/);
  await expect(page.getByRole("link", { name: /Corner launcher route/ })).toBeVisible();
});

test("character tabs and the other three detail layouts are discoverable", async ({ page }) => {
  await page.goto("/characters/ragna?type=build");
  await expect(page.getByText("No posts in this category yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Share the first post" })).toHaveAttribute("href", "/posts/new?character=ragna&type=build");
  for (const [type, heading] of [["build", "Priority upgrades"], ["tactic", "Steps"], ["speedrun", "Run summary"]]) {
    await page.goto(`/browse?type=${type}`);
    await page.locator("main ul a").first().click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
