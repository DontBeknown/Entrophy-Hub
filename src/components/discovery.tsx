import Link from "next/link";
import type { Filters } from "@/lib/posts";
import { listUrl } from "@/lib/posts";

export function Pagination({ path, filters, more }: { path: string; filters: Filters; more: boolean }) {
  if (filters.page === 1 && !more) return null;
  return <nav aria-label="Results pages" className="row">
    {filters.page > 1 && <Link className="button secondary" href={listUrl(path, { ...filters, page: filters.page - 1 })}>Previous</Link>}
    <span>Page {filters.page}</span>
    {more && <Link className="button secondary" href={listUrl(path, { ...filters, page: filters.page + 1 })}>Next</Link>}
  </nav>;
}
