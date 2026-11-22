"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, signInUrl } from "@/lib/auth";
import { isPostType } from "@/lib/posts";
import { editorFields } from "@/lib/editor";
import { isVideoType } from "@/lib/media";
import { database } from "@/lib/supabase";

export type SaveResult = { error?: string };

export async function savePost(id: string | null, _previous: SaveResult, data: FormData): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) redirect(signInUrl(id ? `/posts/${id}/edit` : "/posts/new"));
  const db = await database();
  if (!db) return { error: "Publishing is unavailable." };
  const text = (key: string) => String(data.get(key) ?? "").trim();
  const type = text("type");
  const title = text("title");
  const description = text("description");
  const character = text("character");
  const version = text("version");
  const difficulty = text("difficulty");
  const video = text("video");
  if (!isPostType(type) || !character) return { error: "Choose a post type and character." };
  if (type === "speedrun" && !id && !video) return { error: "Upload a run recording before publishing." };
  if (video && (!isVideoType(type) || !video.startsWith(`${user}/`) || video.length > 90)) {
    return { error: "Select a valid recording." };
  }
  if (!title || title.length > 120 || !description || description.length > 4000 || version.length > 80 || difficulty.length > 80) {
    return { error: "Check the title, description, and optional details." };
  }
  const body: Record<string, string> = {};
  for (const field of editorFields[type]) {
    const value = text(field.key);
    if ((field.required && !value) || value.length > (field.max ?? 4000)) return { error: `Check the ${field.label.toLowerCase()} field.` };
    if (value) body[field.key] = value;
  }
  if (type === "speedrun" && !/^[0-9]{2,3}:[0-5][0-9]:[0-5][0-9]$/.test(body.time)) {
    return { error: "Enter a run time in HH:MM:SS format." };
  }
  const values = { character, title, description, version: version || null, difficulty: difficulty || null, body, ...(video ? { video } : {}) };
  const query = id
    ? db.from("posts").update(values).eq("id", id).eq("author_id", user).eq("type", type)
    : db.from("posts").insert({ ...values, type, author_id: user });
  const { data: saved, error } = await query.select("id").maybeSingle();
  if (error || !saved) return { error: "Could not save the post. Check your fields and try again." };
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/my-posts");
  revalidatePath(`/characters/${character}`);
  revalidatePath(`/posts/${saved.id}`);
  redirect(`/posts/${saved.id}`);
}
