import { PostEditor } from "@/components/post-editor";
import { requireUser } from "@/lib/auth";
import { filtersFrom, getCharacters, listUrl, type Query } from "@/lib/posts";

export const metadata = { title: "Create post" };

export default async function CreatePost({ searchParams }: { searchParams: Promise<Query> }) {
  const { character, type } = filtersFrom(await searchParams);
  await requireUser(listUrl("/posts/new", { character, type }));
  const roster = await getCharacters();
  return <div className="container page"><section className="narrow stack">
    <h1>Create post</h1>
    <PostEditor roster={roster} initialCharacter={roster.some(({ slug }) => slug === character) ? character : ""}
      initialType={type} />
  </section></div>;
}
