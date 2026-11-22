import { isVideoType, videoRules } from "@/lib/media";
import { getPost } from "@/lib/posts";
import { storageAdmin } from "@/lib/storage-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post?.video || !isVideoType(post.type)) return new Response(null, { status: 404 });
  const storage = storageAdmin()?.storage.from(videoRules[post.type].bucket);
  const result = await storage?.createSignedUrl(post.video, 900);
  if (!result?.data) return new Response(null, { status: 503 });
  return Response.json({ url: result.data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
