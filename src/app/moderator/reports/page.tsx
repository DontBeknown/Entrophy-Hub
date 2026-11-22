import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/report-forms";
import { hasModeratorAccess, requireUser } from "@/lib/auth";
import { param, type Query } from "@/lib/posts";
import { database } from "@/lib/supabase";

export const metadata = { title: "Moderator reports" };
const pageSize = 20;

export default async function Reports({ searchParams }: { searchParams: Promise<Query> }) {
  await requireUser("/moderator/reports");
  if (!(await hasModeratorAccess())) notFound();
  const db = (await database())!;
  const pageValue = Number(param(await searchParams, "page"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue < 10_000 ? pageValue : 1;
  const { data, error } = await db.from("reports").select("id,post_id,comment_id,reason,created_at").is("decision", null)
    .order("created_at").order("id").range((page - 1) * pageSize, page * pageSize);
  if (error) throw error;
  return <div className="container page narrow stack">
    <h1>Moderator reports</h1>
    {!data.length && <p>No pending reports on this page.</p>}
    {data.slice(0, pageSize).map((report) => {
      const path = `/posts/${report.post_id}`;
      const link = report.comment_id ? `${path}?comment=${report.comment_id}#comment-${report.comment_id}` : path;
      return <article className="panel stack" key={report.id}>
        <div><h2>{report.comment_id ? "Reported comment" : "Reported post"}</h2><p className="prose">{report.reason}</p></div>
        <Link href={link}>View {report.comment_id ? "comment in context" : "post"}</Link>
        <ReviewForm reportId={report.id} postId={report.post_id} isComment={!!report.comment_id} />
      </article>;
    })}
    {(page > 1 || data.length > pageSize) && <nav aria-label="Report queue pages" className="row">
      {page > 1 && <Link href={`/moderator/reports?page=${page - 1}`}>Previous</Link>}
      {data.length > pageSize && <Link href={`/moderator/reports?page=${page + 1}`}>Next</Link>}
    </nav>}
  </div>;
}
