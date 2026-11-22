import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
export const admin = url && secret && new URL(url).hostname === "127.0.0.1"
  ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const password = "Local-test-password-2026";

export async function member() {
  if (!admin) throw new Error("Local Supabase is required for member tests.");
  const email = `player-${crypto.randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Test Player" } });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

export async function signIn(page: Page, user: { email: string; password: string }, next: string) {
  await page.goto(`/sign-in?${new URLSearchParams({ next })}`);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new URL(next, "http://127.0.0.1:3211").toString());
}
