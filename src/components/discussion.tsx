import Link from "next/link";
import { currentUser, signInUrl } from "@/lib/auth";
import type { Post } from "@/lib/demo";
import { getDiscussion, type Comment } from "@/lib/discussion";
import { param, type Query } from "@/lib/posts";
import styles from "./site.module.css";
import { CommentForm, ReactionForm } from "./discussion-forms";

function CommentCard({ comment, children }: { comment: Comment; children?: React.ReactNode }) {
  const author = comment.body ? comment.profiles?.display_name || "Player" : "Removed comment";
  return <article className="panel comment" id={`comment-${comment.id}`} aria-label={author}>
    <p className="comment-meta"><strong>{author}</strong> · <span className="muted">
      {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(comment.created_at))}
    </span></p>
    {comment.body && <p className="prose">{comment.body}</p>}
    {children}
  </article>;
}

export async function Discussion({ post, query }: { post: Post; query: Query }) {
  const user = await currentUser();
  const path = `/posts/${post.id}`;
  const pageValue = Number(param(query, "discussion"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue < 10000 ? pageValue : 1;
  const replyTo = param(query, "reply");
  const focus = param(query, "comment") || replyTo;
  const { roots, replies, reaction, more } = await getDiscussion(post.id, user, page, focus);
  return <>
    <section id="reactions" aria-label="Reactions">
      {user ? <ReactionForm postId={post.id} reaction={reaction} likes={post.likes} dislikes={post.dislikes} />
        : <div className="row">
          <Link className="button secondary" href={signInUrl(`${path}#reactions`)}>Like · {post.likes}</Link>
          <Link className="button secondary" href={signInUrl(`${path}#reactions`)}>Dislike · {post.dislikes}</Link>
        </div>}
    </section>
    <section id="discussion" aria-labelledby="discussion-title" className="stack">
      <h2 id="discussion-title" className={styles.heading}>Discussion</h2>
      {user ? <CommentForm key={focus} postId={post.id} />
        : <Link href={signInUrl(`${path}#discussion`)}>Sign in to comment</Link>}
      {roots.length === 0 && <p className="muted">No comments yet.</p>}
      {roots.map((comment) => <div key={comment.id} className="stack">
        <CommentCard comment={comment}>
          {comment.body && (user
            ? <details open={replyTo === comment.id || undefined}><summary>Reply</summary><CommentForm key={focus} postId={post.id} parentId={comment.id} /></details>
            : <Link href={signInUrl(`${path}?reply=${comment.id}#comment-${comment.id}`)}>Reply</Link>)}
        </CommentCard>
        {replies.filter(({ parent_id }) => parent_id === comment.id).map((reply) =>
          <div key={reply.id} className="comment-reply"><CommentCard comment={reply} /></div>)}
      </div>)}
      {(page > 1 || more) && <nav className="row" aria-label="Discussion pages">
        {page > 1 && <Link href={`${path}?discussion=${page - 1}#discussion`}>Newer comments</Link>}
        {more && <Link href={`${path}?discussion=${page + 1}#discussion`}>Older comments</Link>}
      </nav>}
    </section>
  </>;
}
