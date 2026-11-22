"use server";

import { currentUser } from "@/lib/auth";
import { isVideoType, videoRules, type VideoType } from "@/lib/media";
import { database } from "@/lib/supabase";

export async function reserveVideo(type: VideoType, bytes: number) {
  if (!isVideoType(type) || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > videoRules[type].maxBytes) return null;
  if (!(await currentUser())) return null;
  const db = await database();
  const result = await db?.from("media_uploads").insert({ purpose: type }).select("path").single();
  if (!result?.data || result.error) return null;
  return String(result.data.path);
}
