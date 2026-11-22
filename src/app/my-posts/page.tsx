import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/supabase";
import { param, type Query } from "@/lib/posts";

export const metadata = { title: "My posts" };
const pageSize = 20;

export default async function MyPosts({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireUser("/my-posts");
  const pageValue = Number(param(await searchParams, "page"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue < 10000 ? pageValue : 1;
  const db = (await database())!;
  const { data, error } = await db.from("posts").select("id,title").eq("author_id", user).is("removed_at", null)
    .order("published_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * pageSize, page * pageSize);
  if (error) throw error;
  return <div className="container page stack">
    <h1>My posts</h1>
    {data.slice(0, pageSize).map((post) => <article key={post.id} className="panel">
      <h2>{post.title}</h2><div className="row">
        <Link className="button secondary" href={`/posts/${post.id}`}>View<span className="sr-only"> {post.title}</span></Link>
        <Link className="button secondary" href={`/posts/${post.id}/edit`}>Edit<span className="sr-only"> {post.title}</span></Link>
      </div>
    </article>)}
    {!data.length && <p>{page === 1 ? "You haven’t published a post yet." : "No posts on this page."}</p>}
    <div className="row">
      {page > 1 && <Link href={`/my-posts?page=${page - 1}`}>Previous</Link>}
      {data.length > pageSize && <Link href={`/my-posts?page=${page + 1}`}>Next</Link>}
      <Link className="button" href="/posts/new">Create post</Link>
    </div>
  </div>;
}
