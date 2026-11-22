import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, member, signIn } from "./members";

test("moderation is private, dismiss is non-destructive, and removal preserves replies", async ({ page, browser, request }) => {
  test.skip(!admin, "Requires local Supabase");
  test.setTimeout(60_000);
  const author = await member();
  const moderator = await member();
  const reportsPath = "/moderator/reports";
  const result = await admin!.from("posts").insert({
    author_id: author.id, character: "ragna", type: "combo", title: "Moderation test post",
    description: "This temporary post is used to verify moderation.", body: { sequence: "Dash | →" },
  }).select("id").single();
  expect(result.error).toBeNull();
  const postId = result.data!.id;
  const postPath = `/posts/${postId}`;
  try {
    const role = await admin!.from("moderators").insert({ user_id: moderator.id });
    expect(role.error).toBeNull();
    const comment = await admin!.from("comments").insert({ post_id: postId, author_id: author.id, body: "Comment to be removed." }).select("id").single();
    expect(comment.error).toBeNull();
    const reply = await admin!.from("comments").insert({ post_id: postId, author_id: author.id, parent_id: comment.data!.id, body: "Reply to preserve." });
    expect(reply.error).toBeNull();

    await page.goto(reportsPath);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await signIn(page, author, postPath);
    expect((await page.goto(reportsPath))?.status()).toBe(404);
    await page.goto(postPath);
    await page.getByText("Report post", { exact: true }).click();
    await page.getByRole("textbox", { name: "Reason" }).fill("Dismiss this sample report.");
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByRole("status")).toContainText("Report sent");
    const commentCard = page.locator("article.comment").filter({ hasText: "Comment to be removed." });
    await commentCard.getByText("Report comment", { exact: true }).click();
    await commentCard.getByRole("textbox", { name: "Reason" }).fill("Remove this sample comment.");
    await commentCard.getByRole("button", { name: "Send report" }).click();
    await expect(commentCard.getByRole("status")).toContainText("Report sent");

    const modPage = await browser.newPage({ baseURL: "http://127.0.0.1:3211" });
    try {
      await signIn(modPage, moderator, reportsPath);
      const postReport = modPage.getByRole("article").filter({ hasText: "Dismiss this sample report." });
      await postReport.getByRole("button", { name: "Dismiss report" }).click();
      await expect(postReport).toHaveCount(0);
      expect((await request.get(postPath)).ok()).toBe(true);

      const commentReport = modPage.getByRole("article").filter({ hasText: "Remove this sample comment." });
      const context = await commentReport.getByRole("link", { name: "View comment in context" }).getAttribute("href");
      expect(context).toBe(`${postPath}?comment=${comment.data!.id}#comment-${comment.data!.id}`);
      await commentReport.getByRole("button", { name: "Remove comment" }).click();
      const dialog = modPage.getByRole("dialog", { name: "Remove this comment?" });
      await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
      await dialog.getByRole("button", { name: "Remove content" }).click();
      await expect(commentReport).toHaveCount(0);
      await page.goto(context!);
      await expect(page.getByText("Removed comment", { exact: true })).toBeVisible();
      await expect(page.getByText("Reply to preserve.")).toBeVisible();
      await expect(page.getByText("Comment to be removed.")).toHaveCount(0);

      const pending = await admin!.from("reports").insert({ post_id: postId, reporter_id: author.id, reason: "Concurrent post removal." }).select("id").single();
      expect(pending.error).toBeNull();
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      expect((await client.auth.signInWithPassword(moderator)).error).toBeNull();
      const reviews = await Promise.all([1, 2].map(() => client.rpc("review_report", { report_id: pending.data!.id, outcome: "remove" })));
      expect(reviews.filter(({ error }) => !error)).toHaveLength(1);
      expect(reviews.find(({ error }) => error)?.error?.code).toBe("P0002");
      expect((await request.get(postPath)).status()).toBe(404);
      const audit = await admin!.from("reports").select("decision,reviewed_by,reviewed_at").eq("id", pending.data!.id).single();
      expect(audit.data).toMatchObject({ decision: "remove", reviewed_by: moderator.id, reviewed_at: expect.any(String) });
    } finally {
      await modPage.close();
    }
  } finally {
    await admin!.auth.admin.deleteUser(author.id);
    await admin!.auth.admin.deleteUser(moderator.id);
  }
});
