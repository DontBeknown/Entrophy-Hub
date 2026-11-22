import Link from "next/link";
import { PostList } from "@/components/site";
import { Pagination } from "@/components/discovery";
import { FilterDisclosure } from "@/components/filter-disclosure";
import { postTypes, typeLabels } from "@/lib/demo";
import { filtersFrom, getCharacters, listPosts, listUrl, type Query } from "@/lib/posts";

export const metadata = { title: "Browse" };

export default async function Browse({ searchParams }: { searchParams: Promise<Query> }) {
  const filters = filtersFrom(await searchParams);
  const [roster, { posts, more }] = await Promise.all([getCharacters(), listPosts(filters)]);
  const clear = listUrl("/browse", { q: filters.q });
  return <div className="container page stack">
    <h1>Browse posts</h1>
    <search><form action="/browse" id="browse" className="search-row">
      <input type="search" name="q" aria-label="Search posts" placeholder="Search posts" maxLength={120} defaultValue={filters.q} />
      <button className="button secondary">Search</button>
    </form></search>
    <div className="browse-layout">
      <FilterDisclosure count={Number(Boolean(filters.character)) + Number(Boolean(filters.type))}>
        <label>Character<select form="browse" name="character" defaultValue={filters.character}>
          <option value="">All characters</option>
          {roster.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>)}
        </select></label>
        <label>Post type<select form="browse" name="type" defaultValue={filters.type || ""}>
          <option value="">All types</option>
          {postTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
        </select></label>
        <button className="button secondary" form="browse">Apply filters</button>
        <Link href={clear}>Clear filters</Link>
      </FilterDisclosure>
      <div className="stack">
        {posts.length ? <PostList posts={posts} roster={roster} details /> : <div className="panel">
          <p>No posts match your search and filters.</p><Link href={clear}>Clear filters</Link>
        </div>}
        <Pagination path="/browse" filters={filters} more={more} />
      </div>
    </div>
  </div>;
}
