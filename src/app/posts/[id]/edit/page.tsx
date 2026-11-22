import { notFound } from "next/navigation";
import { PostEditor } from "@/components/post-editor";
import { requireUser } from "@/lib/auth";
import { getCharacters, getPost } from "@/lib/posts";

export const metadata = { title: "Edit post" };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/posts/${id}/edit`);
  const [post, roster] = await Promise.all([getPost(id), getCharacters()]);
  if (!post || post.author_id !== user) notFound();
  return <div className="container page"><section className="narrow stack">
    <h1>Edit post</h1>
    <PostEditor roster={roster} post={post} />
  </section></div>;
}
