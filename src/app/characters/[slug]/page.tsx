import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterPortrait, PostList } from "@/components/site";
import { Pagination } from "@/components/discovery";
import { postTypes, typeLabels } from "@/lib/demo";
import { filtersFrom, getCharacters, listPosts, listUrl, type Query } from "@/lib/posts";

export default async function CharacterPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Query> }) {
  const [{ slug }, query, roster] = await Promise.all([params, searchParams, getCharacters()]);
  const character = roster.find((entry) => entry.slug === slug);
  if (!character) notFound();
  const filters = { ...filtersFrom(query), character: slug, q: "" };
  const { posts, more } = await listPosts(filters);
  const path = `/characters/${slug}`;
  const listFilters = { ...filters, character: "" };
  const editorUrl = listUrl("/posts/new", { character: slug, type: filters.type });
  return <div className="container page stack">
    <Link href="/characters">Characters</Link>
    <header className="character-heading row">
      <div className="character-badge"><CharacterPortrait character={character} compact /></div>
      <h1>{character.name}</h1>
    </header>
    <nav aria-label="Post types" className="row category-tabs">
      {[undefined, ...postTypes].map((type) =>
        <Link key={type ?? "all"} href={listUrl(path, { sort: filters.sort, type })}
          aria-current={filters.type === type ? "page" : undefined}>{type ? typeLabels[type] : "All"}</Link>
      )}
    </nav>
    <div className="row">
      <form action={path} className="row">
        {filters.type && <input type="hidden" name="type" value={filters.type} />}
        <label>Sort posts<select name="sort" defaultValue={filters.sort}><option value="newest">Newest</option><option value="liked">Most liked</option></select></label>
        <button className="button secondary">Apply</button>
      </form>
      <Link className="button" href={editorUrl}>Create post</Link>
    </div>
    {posts.length ? <PostList posts={posts} roster={roster} details /> : <div className="panel">
      <p>{filters.page > 1 ? "No posts on this page." : "No posts in this category yet."}</p>
      {filters.page === 1 && <Link href={editorUrl}>Share the first post</Link>}
    </div>}
    <Pagination path={path} filters={listFilters} more={more} />
  </div>;
}
