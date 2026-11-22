"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthResult } from "@/app/sign-in/actions";

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const signup = mode === "signup";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [result, action, pending] = useActionState<AuthResult, FormData>(authenticate.bind(null, mode, next), {});
  return <form action={action} className="stack">
    {signup && <label>Display name<input name="name" autoComplete="nickname" required maxLength={40} value={name} onChange={(event) => setName(event.target.value)} /></label>}
    <label>Email<input type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Password<input type="password" name="password" autoComplete={signup ? "new-password" : "current-password"}
      minLength={signup ? 8 : undefined} maxLength={128} required /></label>
    {result.error && <p role="alert">{result.error}</p>}
    {result.message && <p role="status">{result.message}</p>}
    <button className="button" disabled={pending}>{signup ? "Create account" : "Sign in"}</button>
  </form>;
}
