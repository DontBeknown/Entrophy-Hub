import { NextRequest, NextResponse } from "next/server";
import { returnPath, signInUrl } from "@/lib/auth";
import { database } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const db = await database();
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  const next = returnPath(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL(`${signInUrl(next)}&error=confirmation`, origin));
}
