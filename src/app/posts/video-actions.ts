"use server";

import { currentUser } from "@/lib/auth";
import { isVideoType, videoRules, type VideoType } from "@/lib/media";
import { database } from "@/lib/supabase";

export async function reserveVideo(type: VideoType, bytes: number, poster: string | null) {
  if (!isVideoType(type) || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > videoRules[type].maxBytes) return null;
  if (!(await currentUser())) return null;
  const jpeg = typeof poster === "string" && poster.length >= 32 && poster.length <= 65536 && /^\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(poster)
    ? poster : null;
  const db = await database();
  const result = await db?.from("media_uploads").insert({ purpose: type, poster_jpeg: jpeg }).select("path").single();
  if (!result?.data || result.error) return null;
  return String(result.data.path);
}
