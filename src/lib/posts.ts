import { cache } from "react";
import { characters, demoPosts, postTypes, type Character, type Post, type PostType } from "./demo";
import { database } from "./supabase";

export type Query = Record<string, string | string[] | undefined>;
export type Filters = { q: string; character: string; type?: PostType; sort: "newest" | "liked"; page: number };
const pageSize = 12;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPostType(value: unknown): value is PostType {
  return postTypes.some((type) => type === value);
}

export function param(query: Query, key: string) {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

export function filtersFrom(query: Query): Filters {
  const type = param(query, "type");
  const page = Number(param(query, "page"));
  const character = param(query, "character");
  return {
    q: param(query, "q").trim().slice(0, 120),
    character: /^[a-z0-9-]{1,80}$/.test(character) ? character : "",
    type: isPostType(type) ? type : undefined,
    sort: param(query, "sort") === "liked" ? "liked" : "newest",
    page: Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1,
  };
}

export function listUrl(path: string, filters: Partial<Filters>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && !(key === "page" && value === 1) && !(key === "sort" && value === "newest")) params.set(key, String(value));
  }
  return params.size ? `${path}?${params}` : path;
}

export const getCharacters = cache(async (): Promise<Character[]> => {
  const db = await database();
  if (!db) return characters;
  const { data, error } = await db.from("characters").select("slug,name,color,portrait").order("name");
  if (error) throw error;
  return data;
});

export async function listPosts(filters: Filters) {
  const db = await database();
  const offset = (filters.page - 1) * pageSize;
  if (!db) {
    const matches = demoPosts.filter((post) => (!filters.character || post.character === filters.character)
      && (!filters.type || post.type === filters.type)
      && `${post.title} ${post.description}`.toLowerCase().includes(filters.q.toLowerCase()));
    return { posts: matches.slice(offset, offset + pageSize), more: matches.length > offset + pageSize };
  }
  let query = db.from("post_summaries").select("*");
  if (filters.q) query = query.ilike("search_text", `%${filters.q.replace(/[\\%_*]/g, "\\$&")}%`);
  if (filters.character) query = query.eq("character", filters.character);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.sort === "liked") query = query.order("likes", { ascending: false });
  const { data, error } = await query.order("published_at", { ascending: false })
    .order("id", { ascending: false }).range(offset, offset + pageSize);
  if (error) throw error;
  return { posts: (data as Post[]).slice(0, pageSize), more: data.length > pageSize };
}

export async function getPost(id: string): Promise<Post | undefined> {
  const db = await database();
  if (!db) return demoPosts.find((post) => post.id === id);
  if (!uuid.test(id)) return undefined;
  const { data, error } = await db.from("post_summaries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Post | undefined;
}
