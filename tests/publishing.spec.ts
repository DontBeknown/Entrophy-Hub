import { expect, test } from "@playwright/test";
import { admin, member, signIn } from "./members";

test("sign-in returns to a prefilled editor and only the author can edit", async ({ page, browser }) => {
  test.skip(!admin, "Requires local Supabase");
  const author = await member();
  const other = await member();
  try {
    await page.goto("/characters/ragna?type=combo");
    await page.locator("main").getByRole("link", { name: "Create post" }).click();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByLabel("Email").fill(author.email);
    await page.getByLabel("Password").fill(author.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Character", exact: true })).toHaveValue("ragna");
    await expect(page.getByLabel("Post type")).toHaveValue("combo");
    await page.getByLabel("Title").fill("A browser-tested combo");
    await page.getByLabel("Description").fill("A clip-free description.");
    await page.getByLabel("Input sequence").fill(" ");
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("input sequence");
    await expect(page.getByLabel("Title")).toHaveValue("A browser-tested combo");
    await page.getByLabel("Input sequence").fill("Dash in | → → + D");
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.getByRole("heading", { name: "A browser-tested combo" })).toBeVisible();
    const postPath = new URL(page.url()).pathname;
    await page.goto("/my-posts");
    await page.getByRole("link", { name: /Edit A browser-tested combo/ }).click();
    await page.getByLabel("Title").fill("Updated browser-tested combo");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Updated browser-tested combo" })).toBeVisible();
    const differentPage = await browser.newPage({ baseURL: "http://127.0.0.1:3211" });
    try {
      await signIn(differentPage, other, "/");
      const response = await differentPage.goto(`${postPath}/edit`);
      expect(response?.status()).toBe(404);
    } finally {
      await differentPage.close();
    }
  } finally {
    await admin!.auth.admin.deleteUser(author.id);
    await admin!.auth.admin.deleteUser(other.id);
  }
});

test("email confirmation restores the original return URL", async ({ page, request }) => {
  test.skip(!admin, "Requires local Supabase and Mailpit");
  const token = crypto.randomUUID();
  const email = `signup-${token}@example.com`;
  const displayName = `Email Test ${token.slice(0, 8)}`;
  const next = "/posts/new?character=noel&type=build";
  try {
    await page.goto(`/sign-in?${new URLSearchParams({ mode: "signup", next })}`);
    await page.getByLabel("Display name").fill(displayName);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Local-test-password-2026");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("status")).toContainText("Check your email");
    const mail = "http://127.0.0.1:54324/api/v1";
    let messageId: string | undefined;
    await expect.poll(async () => {
      const response = await request.get(`${mail}/search?query=${encodeURIComponent(`to:${email}`)}`);
      const result = await response.json();
      messageId = result.messages?.[0]?.ID;
      return messageId;
    }).toBeTruthy();
    const response = await request.get(`${mail}/message/${messageId}`);
    const message = await response.json();
    const link = String(message.HTML).match(/href="([^"]*\/verify\?[^"]+)"/)?.[1].replaceAll("&amp;", "&");
    expect(link).toBeTruthy();
    await page.goto(link!);
    await expect(page.getByRole("heading", { name: "Create post" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Character", exact: true })).toHaveValue("noel");
  } finally {
    const profile = await admin!.from("profiles").select("id").eq("display_name", displayName).maybeSingle();
    expect(profile.error).toBeNull();
    if (profile.data) expect((await admin!.auth.admin.deleteUser(profile.data.id)).error).toBeNull();
  }
});
