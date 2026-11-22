import { expect, test } from "@playwright/test";
import { admin, member } from "./members";

test("phone layouts stay in reading order and keyboard users can skip the header", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.locator("main").blur();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("home-desktop.png") });

  const post = admin ? "20000000-0000-4000-8000-000000000001" : "corner-launcher";
  await page.goto(`/posts/${post}`);
  const video = page.locator("video");
  const inputs = page.getByRole("heading", { name: "Input sequence" });
  const videoBox = await video.boundingBox();
  const inputsBox = await inputs.boundingBox();
  expect(videoBox!.x + videoBox!.width).toBeLessThan(inputsBox!.x);
  await page.screenshot({ path: testInfo.outputPath("combo-desktop.png") });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.getByRole("link", { name: "Like · 0", exact: true })).toHaveCSS("transition-duration", "0s");
  expect((await video.boundingBox())!.y).toBeLessThan((await inputs.boundingBox())!.y);
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  expect(await video.getAttribute("src")).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: testInfo.outputPath("combo-phone.png"), fullPage: true });
  await page.getByRole("button", { name: "Play video" }).click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);

  if (admin) {
    await page.goto("/characters?q=platinum");
    await expect(page.getByRole("link", { name: "Platinum the Trinity" })).toBeVisible();
  }
});

test("upload cleanup requires authentication and preserves recent reservations", async ({ request }) => {
  test.skip(!admin, "Requires local Supabase");
  const user = await member();
  try {
    const { data, error } = await admin!.from("media_uploads").insert([
      { owner_id: user.id, purpose: "combo", expires_at: "2000-01-01T00:00:00Z" },
      { owner_id: user.id, purpose: "combo", expires_at: "2099-01-01T00:00:00Z" },
    ]).select("id,expires_at");
    expect(error).toBeNull();
    expect((await request.get("/api/cleanup-uploads")).status()).toBe(401);
    const response = await request.get("/api/cleanup-uploads", {
      headers: { Authorization: "Bearer entropy-hub-local-e2e-only" },
    });
    expect(response.ok()).toBe(true);
    const remaining = await admin!.from("media_uploads").select("id").eq("owner_id", user.id);
    expect(remaining.data).toEqual([{ id: data!.find((item) => item.expires_at.startsWith("2099"))!.id }]);
  } finally {
    await admin!.auth.admin.deleteUser(user.id);
  }
});
