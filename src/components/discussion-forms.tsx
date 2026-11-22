"use client";

import { useActionState, useState } from "react";
import { addComment, setReaction } from "@/app/posts/discussion-actions";

export function ReactionForm({ postId, reaction, likes, dislikes }: { postId: string; reaction: number; likes: number; dislikes: number }) {
  const [error, action, pending] = useActionState(setReaction.bind(null, postId), "");
  return <form action={action} className="row" aria-label="React to this post">
    <button type="submit" className={`button${reaction === 1 ? "" : " secondary"}`} disabled={pending}
      aria-pressed={reaction === 1} name="reaction" value={reaction === 1 ? "0" : "1"}>Like · {likes}</button>
    <button type="submit" className={`button${reaction === -1 ? "" : " secondary"}`} disabled={pending}
      aria-pressed={reaction === -1} name="reaction" value={reaction === -1 ? "0" : "-1"}>Dislike · {dislikes}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}

export function CommentForm({ postId, parentId = null }: { postId: string; parentId?: string | null }) {
  const [error, action, pending] = useActionState(addComment.bind(null, postId, parentId), "");
  const [comment, setComment] = useState("");
  const label = parentId ? "Your reply" : "Your comment";
  return <form action={action} className="stack" aria-label={label}>
    <label>{label}<textarea name="comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} required /></label>
    {error && <p role="alert">{error}</p>}
    <button type="submit" className="button" disabled={pending}>{parentId ? "Post reply" : "Post comment"}</button>
  </form>;
}
