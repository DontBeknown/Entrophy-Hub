import { timingSafeEqual } from "node:crypto";
import { isVideoType, videoRules } from "@/lib/media";
import { storageAdmin } from "@/lib/storage-admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response(null, { status: 503 });
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return new Response(null, { status: 401 });
  }
  const admin = storageAdmin();
  if (!admin) return new Response(null, { status: 503 });
  const { data, error } = await admin.rpc("claim_expired_uploads");
  if (error) return new Response(null, { status: 500 });
  let removed = 0;
  let failed = 0;
  for (const { id, purpose, path } of data ?? []) {
    if (!isVideoType(purpose)) { failed++; continue; }
    const deletion = await admin.storage.from(videoRules[purpose].bucket).remove([path]);
    if (deletion.error) { failed++; continue; }
    const reservation = await admin.from("media_uploads").delete().eq("id", id).eq("purging", true);
    if (reservation.error) failed++;
    else removed++;
  }
  return Response.json({ removed, failed }, { status: failed ? 500 : 200 });
}
