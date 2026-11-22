"use client";

import { useActionState, useRef, useState } from "react";
import { reportContent, reviewReport, type ReportResult } from "@/app/moderator/actions";

export function ReportForm({ postId, commentId = null }: { postId: string; commentId?: string | null }) {
  const [result, action, pending] = useActionState<ReportResult, FormData>(reportContent.bind(null, postId, commentId), {});
  const [reason, setReason] = useState("");
  return <details className="report-form">
    <summary>{commentId ? "Report comment" : "Report post"}</summary>
    {result.sent ? <p role="status">Report sent for moderator review.</p> : <form action={action} className="stack">
      <label>Reason<textarea name="reason" value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} /></label>
      {result.error && <p role="alert">{result.error}</p>}
      <button className="button secondary" disabled={pending}>Send report</button>
    </form>}
  </details>;
}

export function ReviewForm({ reportId, postId, isComment }: { reportId: string; postId: string; isComment: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, action, pending] = useActionState(reviewReport.bind(null, reportId, postId), "");
  const titleId = `remove-${reportId}`;
  return <div>
    <form className="row" action={action}>
      <button type="submit" name="outcome" value="dismiss" className="button secondary" disabled={pending}>Dismiss report</button>
      <button type="button" className="button secondary" disabled={pending} onClick={() => dialog.current?.showModal()}>
        {isComment ? "Remove comment" : "Remove post"}
      </button>
    </form>
    <dialog ref={dialog} aria-labelledby={titleId} className="panel">
      <h2 id={titleId}>{isComment ? "Remove this comment?" : "Remove this post?"}</h2>
      <p>The content will be hidden from public view.</p>
      <div className="row">
        <form method="dialog"><button className="button secondary" autoFocus>Cancel</button></form>
        <form action={action} onSubmit={() => dialog.current?.close()}>
          <input type="hidden" name="outcome" value="remove" />
          <button className="button" disabled={pending}>Remove content</button>
        </form>
      </div>
    </dialog>
    {error && <p role="alert">{error}</p>}
  </div>;
}
