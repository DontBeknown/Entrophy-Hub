import Link from "next/link";
import { CharacterGrid, PostList, Search } from "@/components/site";
import styles from "@/components/site.module.css";
import { characters, demoPosts } from "@/lib/demo";

export default function Home() {
  return <>
    <section className={styles.hero} aria-labelledby="hero-title"><div className={`container ${styles.heroInner}`}>
      <h1 id="hero-title" className={styles.rule}>Find your next build.</h1>
      <p>Builds, tactics, combos, and speedruns.</p>
      <Search />
      <Link className="button" href="/characters">Choose a character</Link>
    </div></section>
    <div className="container">
      <section className="section" aria-labelledby="characters-title">
        <h2 id="characters-title" className={styles.heading}>Characters</h2>
        <CharacterGrid items={characters} />
      </section>
      <section className="section" aria-labelledby="recent-title">
        <h2 id="recent-title" className={styles.heading}>Recent posts</h2>
        <PostList posts={demoPosts.slice(0, 2)} roster={characters} />
      </section>
    </div>
  </>;
}
