import { database } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await database();
  const result = await db?.rpc("public_video_poster", { target: id }).maybeSingle<{ poster_jpeg: string | null }>();
  if (!result?.data || result.error) return new Response(null, { status: 404 });
  const poster = result.data.poster_jpeg;
  if (!poster) return new Response(null, { status: 307, headers: { Location: "/entropy-hero.webp", "Cache-Control": "private, no-store" } });
  return new Response(Uint8Array.from(Buffer.from(poster, "base64")), {
    headers: { "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" },
  });
}
