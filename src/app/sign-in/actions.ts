"use server";

import { redirect } from "next/navigation";
import { returnPath } from "@/lib/auth";
import { database } from "@/lib/supabase";

export type AuthResult = { error?: string; message?: string };

export async function authenticate(mode: "signin" | "signup", next: string, _previous: AuthResult, data: FormData): Promise<AuthResult> {
  const db = await database();
  if (!db) return { error: "Account access is unavailable in demo mode." };
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const target = returnPath(next);
  if (!email || email.length > 254 || password.length > 128 || !password) return { error: "Enter a valid email and password." };
  if (mode === "signup") {
    const name = String(data.get("name") ?? "").trim();
    if (!name || name.length > 40 || password.length < 8) return { error: "Enter a display name and a password of at least 8 characters." };
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callback = new URL("/auth/callback", origin);
    callback.searchParams.set("next", target);
    const { data: result, error } = await db.auth.signUp({
      email, password, options: { data: { display_name: name }, emailRedirectTo: callback.toString() },
    });
    if (error) return { error: error.status === 429 ? "Too many attempts. Try again later." : "Could not create the account. Check your details and try again." };
    if (result.session) redirect(target);
    return { message: "Check your email to confirm your account. Open the link in this browser to continue." };
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "Sign-in failed. Check your email, password, and confirmation email." };
  redirect(target);
}

export async function signOut() {
  const db = await database();
  await db?.auth.signOut();
  redirect("/");
}
