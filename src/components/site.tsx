import Link from "next/link";
import type { CSSProperties } from "react";
import { type Character, type Post, typeLabels } from "@/lib/demo";
import styles from "./site.module.css";

export function Header() {
  const links = <><Link href="/characters">Characters</Link><Link href="/browse">Browse</Link></>;
  const actions = <><Link href="/sign-in">Sign in</Link><Link href="/posts/new" className="button">Create post</Link></>;
  return <header className={styles.header}>
    <div className={`container ${styles.bar}`}>
      <Link href="/" className={styles.brand}>Entropy Hub</Link>
      <nav aria-label="Main navigation" className={`${styles.nav} ${styles.desktop}`}>{links}</nav>
      <div className={`${styles.actions} ${styles.desktop}`}>{actions}</div>
      <details className={styles.mobile} style={{ marginInlineStart: "auto" }}><summary>Menu</summary>
        <nav aria-label="Mobile navigation">{links}{actions}</nav>
      </details>
    </div>
  </header>;
}

export function Search({ action = "/browse", query = "", label = "Search posts" }: { action?: string; query?: string; label?: string }) {
  return <search><form action={action} className="search-row">
    <input type="search" name="q" aria-label={label} placeholder={label} defaultValue={query} />
    <button className="button secondary">Search</button>
  </form></search>;
}

export function CharacterGrid({ items }: { items: Character[] }) {
  return <div className={styles.roster}>{items.map((character) =>
    <Link className={styles.card} href={`/characters/${character.slug}`} key={character.slug}>
      <div className={styles.portrait} style={{ "--character-color": character.color } as CSSProperties} aria-hidden="true">
        <span>{character.name.slice(0, 1)}</span>
      </div>
      <span className={styles.characterName}>{character.name}</span>
    </Link>
  )}</div>;
}

export function PostList({ posts, roster, details = false }: { posts: Post[]; roster: Character[]; details?: boolean }) {
  return <ul className={styles.posts}>{posts.map((post) =>
    <li key={post.id}><Link className={`${styles.card} ${styles.post}`} href={`/posts/${post.id}`}>
      {(post.video || post.demo_video) && <span className={styles.poster} aria-label="Video">▶</span>}
      <div>
        <h3>{post.title}</h3><p>{post.description}</p>
        <p className="muted">{roster.find((character) => character.slug === post.character)?.name ?? post.character} · {typeLabels[post.type]}
          {details && <> · {post.author} · {post.likes} likes · {post.dislikes} dislikes · {post.comments} comments</>}
        </p>
      </div>
    </Link></li>
  )}</ul>;
}
