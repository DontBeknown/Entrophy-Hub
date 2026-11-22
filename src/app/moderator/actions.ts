"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, signInUrl } from "@/lib/auth";
import { database } from "@/lib/supabase";

export type ReportResult = { error?: string; sent?: boolean };

export async function reportContent(postId: string, commentId: string | null, _previous: ReportResult, data: FormData): Promise<ReportResult> {
  if (!(await currentUser())) redirect(signInUrl(`/posts/${postId}`));
  const reason = String(data.get("reason") ?? "").trim();
  if (!reason || reason.length > 500) return { error: "Enter a reason of up to 500 characters." };
  const db = await database();
  const result = await db?.from("reports").insert({ post_id: postId, comment_id: commentId, reason });
  if (result?.error?.code === "23505") return { error: "You already have a pending report for this content." };
  if (!result || result.error) return { error: "Could not send the report. The content may have changed." };
  revalidatePath("/moderator/reports");
  return { sent: true };
}

export async function reviewReport(reportId: string, postId: string, _previous: string, data: FormData) {
  if (!(await currentUser())) redirect(signInUrl("/moderator/reports"));
  const outcome = data.get("outcome");
  if (outcome !== "dismiss" && outcome !== "remove") return "Choose a review action.";
  const db = await database();
  const result = await db?.rpc("review_report", { report_id: reportId, outcome });
  if (result?.error?.code === "P0002") {
    revalidatePath("/moderator/reports");
    return "This report was already reviewed.";
  }
  if (!result || result.error) return "Could not review the report.";
  revalidatePath("/moderator/reports");
  revalidatePath(`/posts/${postId}`);
  return "";
}
