import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, member } from "./members";

const postId = "20000000-0000-4000-8000-000000000001";

test("sign-in returns to a post, reactions stay unique, and members can reply", async ({ page }) => {
  test.skip(!admin, "Requires local Supabase");
  const user = await member();
  try {
    await page.goto(`/posts/${postId}`);
    await page.getByRole("link", { name: "Like · 0", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/posts/${postId}#reactions$`));
    await page.getByRole("button", { name: "Like · 0", exact: true }).click();
    await expect(page.getByRole("button", { name: "Like · 1", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByRole("button", { name: "Like · 1", exact: true })).toHaveAttribute("aria-pressed", "true");

    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect((await client.auth.signInWithPassword(user)).error).toBeNull();
    const duplicate = await Promise.all([1, 1].map((reaction) => client.rpc("set_reaction", { target: postId, reaction })));
    expect(duplicate.every(({ error }) => !error)).toBe(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "Like · 1", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Dislike · 0", exact: true }).click();
    await expect(page.getByRole("button", { name: "Dislike · 1", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Dislike · 1", exact: true }).click();
    await expect(page.getByRole("button", { name: "Dislike · 0", exact: true })).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("textbox", { name: "Your comment" }).fill("Does the combo work on airborne targets?");
    await page.getByRole("button", { name: "Post comment" }).click();
    const thread = page.locator("article.comment").filter({ hasText: "Does the combo work on airborne targets?" });
    await thread.getByText("Reply", { exact: true }).click();
    await thread.getByRole("textbox", { name: "Your reply" }).fill("Delay the follow-up until the target drops.");
    await thread.getByRole("button", { name: "Post reply" }).click();
    await expect(page.getByText("Delay the follow-up until the target drops.")).toBeVisible();
  } finally {
    await admin!.auth.admin.deleteUser(user.id);
  }
});
