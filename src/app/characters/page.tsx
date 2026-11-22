import { CharacterGrid, Search } from "@/components/site";
import { getCharacters, param, type Query } from "@/lib/posts";

export const metadata = { title: "Characters" };

export default async function Characters({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, roster] = await Promise.all([searchParams, getCharacters()]);
  const q = param(query, "q").trim().slice(0, 120);
  const matches = roster.filter((character) => character.name.toLowerCase().includes(q.toLowerCase()));
  return <div className="container page stack">
    <h1>Characters</h1>
    <Search action="/characters" query={q} label="Search characters" />
    {matches.length ? <CharacterGrid items={matches} /> : <p>No characters match your search.</p>}
  </div>;
}
