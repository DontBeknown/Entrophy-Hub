import { database } from "./supabase";

export type Comment = {
  id: string; parent_id: string | null; body: string | null; created_at: string;
  profiles: { display_name: string } | null;
};
const selectComment = "id,parent_id,body,created_at,profiles(display_name)";
const pageSize = 20;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function getDiscussion(postId: string, user: string | null, page: number, focus: string) {
  const databaseClient = await database();
  if (!databaseClient) {
    const demo: Comment = { id: "demo", parent_id: null, body: "Clean route, the corner carry is really good.", created_at: "2026-11-22T05:00:00Z", profiles: { display_name: "KiteFx" } };
    return { roots: postId === "corner-launcher" ? [demo] : [], replies: [] as Comment[], reaction: 0, more: false };
  }
  const db = databaseClient;
  const [pageResult, reactionResult] = await Promise.all([
    db.from("comments").select(selectComment).eq("post_id", postId).is("parent_id", null)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize),
    user ? db.from("reactions").select("value").eq("post_id", postId).eq("user_id", user).maybeSingle() : null,
  ]);
  if (pageResult.error) throw pageResult.error;
  if (reactionResult?.error) throw reactionResult.error;
  const roots = pageResult.data.slice(0, pageSize) as unknown as Comment[];
  if (uuid.test(focus) && !roots.some(({ id }) => id === focus)) {
    const focused = await db.from("comments").select(selectComment).eq("post_id", postId).eq("id", focus).maybeSingle();
    if (focused.error) throw focused.error;
    if (focused.data) {
      const item = focused.data as unknown as Comment;
      if (!item.parent_id) roots.unshift(item);
      else if (!roots.some(({ id }) => id === item.parent_id)) {
        const parent = await db.from("comments").select(selectComment).eq("post_id", postId).eq("id", item.parent_id).maybeSingle();
        if (parent.error) throw parent.error;
        if (parent.data) roots.unshift(parent.data as unknown as Comment);
      }
    }
  }
  const replies: Comment[] = [];
  if (roots.length) {
    // Keep old and new replies reachable even if a thread grows beyond PostgREST's response limit.
    const batchSize = 250;
    for (let offset = 0; ; offset += batchSize) {
      const result = await db.from("comments").select(selectComment).eq("post_id", postId).in("parent_id", roots.map(({ id }) => id))
        .order("created_at").order("id").range(offset, offset + batchSize - 1);
      if (result.error) throw result.error;
      replies.push(...result.data as unknown as Comment[]);
      if (result.data.length < batchSize) break;
    }
  }
  return { roots, replies, reaction: Number(reactionResult?.data?.value ?? 0), more: pageResult.data.length > pageSize };
}
