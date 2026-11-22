import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentUser, returnPath } from "@/lib/auth";
import { param, type Query } from "@/lib/posts";

export const metadata = { title: "Sign in" };

export default async function SignIn({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const next = returnPath(param(query, "next"));
  if (await currentUser()) redirect(next);
  const signup = param(query, "mode") === "signup";
  const link = new URLSearchParams({ next });
  if (!signup) link.set("mode", "signup");
  return <div className="container page"><section className="narrow panel stack">
    <h1>{signup ? "Create an account" : "Sign in"}</h1>
    {param(query, "error") === "confirmation" && <p role="alert">The confirmation link expired or was opened in another browser. Sign in or request a new link.</p>}
    <AuthForm key={String(signup)} mode={signup ? "signup" : "signin"} next={next} />
    <Link href={`/sign-in?${link}`}>{signup ? "Already have an account? Sign in" : "Create an account"}</Link>
  </section></div>;
}
