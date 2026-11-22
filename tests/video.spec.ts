import { expect, test, type Page } from "@playwright/test";
import { mkdtemp, rm, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { admin, member, signIn } from "./members";

async function recording(page: Page) {
  return Buffer.from(await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d")!;
    const stream = canvas.captureStream(20);
    const recorder = new MediaRecorder(stream, { mimeType: "video/mp4;codecs=avc1.42001E" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = ({ data }) => chunks.push(data);
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();
    for (let frame = 0; frame < 25; frame++) {
      context.fillStyle = frame % 2 === 0 ? "#140f32" : "#392380";
      context.fillRect(0, 0, 320, 180);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  }));
}

test("a speedrun needs a recording and resumes a large direct upload", async ({ page, request }) => {
  test.skip(!admin, "Requires local Supabase Storage");
  test.setTimeout(90_000);
  const owner = await member();
  const temp = await mkdtemp(join(tmpdir(), "entropy-video-"));
  const file = join(temp, "test-run.mp4");
  let postId: string | undefined;
  try {
    await signIn(page, owner, "/posts/new?character=ragna&type=speedrun");
    await page.getByLabel("Title").fill("Recorded test run");
    await page.getByLabel("Description").fill("Video upload test with interrupted transfer.");
    await page.getByLabel("Category").fill("Any%");
    await page.getByLabel("Run time").fill("00:12:10");
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Upload a run recording");

    const contents = await recording(page);
    const padding = Buffer.alloc(54 * 1024 ** 2 - contents.length);
    padding.writeUInt32BE(padding.length);
    padding.write("free", 4);
    await writeFile(file, Buffer.concat([contents, padding]));
    let interrupted = false;
    let resumedOffset = 0;
    let offline = true;
    await page.route("**/storage/v1/upload/resumable/**", async (route) => {
      const transfer = route.request();
      const offset = Number(transfer.headers()["upload-offset"] ?? 0);
      if (transfer.method() === "PATCH" && offset > 0) {
        if (offline) { interrupted = true; await route.abort("failed"); return; }
        resumedOffset = Math.max(resumedOffset, offset);
      }
      await route.continue();
    });
    await page.getByLabel("Select video file").setInputFiles(file);
    await expect(page.getByRole("button", { name: "Retry upload" })).toBeVisible({ timeout: 30_000 });
    expect(interrupted).toBe(true);
    await expect(page.getByLabel("Title")).toHaveValue("Recorded test run");
    offline = false;
    await page.getByRole("button", { name: "Retry upload" }).click();
    await expect(page.getByRole("status")).toContainText("Upload complete", { timeout: 30_000 });
    expect(resumedOffset).toBeGreaterThanOrEqual(6 * 1024 ** 2);
    await page.getByRole("button", { name: "Publish post" }).click();
    await expect(page.getByRole("heading", { name: "Recorded test run" })).toBeVisible();
    postId = new URL(page.url()).pathname.split("/").at(-1);
    const thumbnail = await request.get(`/posts/${postId}/thumbnail`);
    expect(thumbnail.headers()["content-type"]).toBe("image/jpeg");
    expect((await thumbnail.body()).subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    const playback = page.waitForResponse((response) => response.url().includes(`/posts/${postId}/video`));
    await page.getByRole("button", { name: "Play video" }).click();
    const signed = await playback;
    expect(signed.ok()).toBe(true);
    const { url } = await signed.json();
    const range = await request.get(url, { headers: { Range: "bytes=0-1023" } });
    expect(range.status()).toBe(206);
    await expect.poll(() => page.locator("video").evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(1);

    await page.goto(`/posts/${postId}/edit`);
    await page.getByLabel("Select video file").setInputFiles({ name: "wrong.txt", mimeType: "text/plain", buffer: Buffer.from("wrong format") });
    await expect(page.locator("main").getByRole("alert")).toContainText("Choose a non-empty MP4");
    await page.getByRole("button", { name: "Clear selection" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("button", { name: "Play video" })).toBeVisible();
    await page.goto("/posts/new?character=ragna&type=combo");
    await page.getByLabel("Select video file").setInputFiles(file);
    await expect(page.locator("main").getByRole("alert")).toContainText("50 MiB");

    const role = await admin!.from("moderators").insert({ user_id: owner.id });
    expect(role.error).toBeNull();
    const report = await admin!.from("reports").insert({ post_id: postId, reporter_id: owner.id, reason: "Remove recording test." }).select("id").single();
    expect(report.error).toBeNull();
    await page.goto("/moderator/reports");
    const queueItem = page.getByRole("article").filter({ hasText: "Remove recording test." });
    await queueItem.getByRole("button", { name: "Remove post" }).click();
    await page.getByRole("button", { name: "Remove content" }).click();
    await expect(queueItem).toHaveCount(0);
    expect((await request.get(`/posts/${postId}/thumbnail`)).status()).toBe(404);
    expect((await request.get(`/posts/${postId}/video`)).status()).toBe(404);
    const reservation = await admin!.from("media_uploads").select("attached,expires_at").eq("owner_id", owner.id).single();
    expect(reservation.data?.attached).toBe(false);
    expect(new Date(reservation.data!.expires_at).getTime()).toBeGreaterThan(Date.now());
  } finally {
    const { data } = await admin!.from("media_uploads").select("path").eq("owner_id", owner.id);
    if (data?.length) await admin!.storage.from("speedrun-recordings").remove(data.map(({ path }) => path));
    await admin!.auth.admin.deleteUser(owner.id);
    await rm(file, { force: true });
    await rmdir(temp);
  }
});
