"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, signInUrl } from "@/lib/auth";
import { database } from "@/lib/supabase";

export async function setReaction(postId: string, _previous: string, form: FormData) {
  if (!(await currentUser())) redirect(signInUrl(`/posts/${postId}#reactions`));
  const value = form.get("reaction");
  if (value !== "-1" && value !== "0" && value !== "1") return "Choose a reaction.";
  const db = await database();
  const result = await db?.rpc("set_reaction", { target: postId, reaction: Number(value) });
  if (!result || result.error) return "Could not update your reaction. Try again.";
  revalidatePath(`/posts/${postId}`);
  return "";
}

export async function addComment(postId: string, parentId: string | null, _previous: string, form: FormData) {
  if (!(await currentUser())) redirect(signInUrl(`/posts/${postId}#discussion`));
  const body = String(form.get("comment") ?? "").trim();
  if (!body || body.length > 2000) return "Write a comment of up to 2,000 characters.";
  const db = await database();
  const result = await db?.from("comments").insert({ post_id: postId, parent_id: parentId, body }).select("id").single();
  if (!result?.data || result.error) return "Could not post your comment. The discussion may have changed.";
  const id = String(result.data.id);
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}?comment=${id}#comment-${id}`);
}
