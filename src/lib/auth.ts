import { cache } from "react";
import { redirect } from "next/navigation";
import { database } from "./supabase";

export function returnPath(path: unknown, fallback = "/") {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u001f]/.test(path)) return fallback;
  const url = new URL(path, "https://entropy.invalid");
  if (url.origin !== "https://entropy.invalid" || url.pathname.startsWith("//")) return fallback;
  return url.pathname + url.search + url.hash;
}

export function signInUrl(next: string) {
  return `/sign-in?${new URLSearchParams({ next })}`;
}

export const currentUser = cache(async () => {
  const db = await database();
  if (!db) return null;
  const { data } = await db.auth.getClaims();
  return typeof data?.claims.sub === "string" ? data.claims.sub : null;
});

export async function requireUser(next: string) {
  const user = await currentUser();
  if (!user) redirect(signInUrl(next));
  return user;
}

export const hasModeratorAccess = cache(async () => {
  if (!(await currentUser())) return false;
  const db = await database();
  const result = await db?.rpc("is_moderator");
  return result?.data === true;
});
