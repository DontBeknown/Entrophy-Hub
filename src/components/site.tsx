import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { signOut } from "@/app/sign-in/actions";
import { currentUser, hasModeratorAccess } from "@/lib/auth";
import { type Character, type Post, typeLabels } from "@/lib/demo";
import { NavLinks } from "./nav-links";
import styles from "./site.module.css";

export async function Header() {
  const user = await currentUser();
  const moderator = user && await hasModeratorAccess();
  const account = <><Link href="/my-posts">My posts</Link>
    {moderator && <Link href="/moderator/reports">Moderator reports</Link>}
    <form action={signOut}><button type="submit" className="button secondary">Sign out</button></form></>;
  const create = <Link href="/posts/new" className="button">Create post</Link>;
  return <header className={styles.header}>
    <div className={`container ${styles.bar}`}>
      <Link href="/" className={styles.brand}>Entropy Hub</Link>
      <nav aria-label="Main navigation" className={`${styles.nav} ${styles.desktop}`}><NavLinks /></nav>
      <div className={`${styles.actions} ${styles.desktop}`}>
        {user ? <details className={styles.account}><summary>Account</summary><div className="panel stack">{account}</div></details>
          : <Link href="/sign-in">Sign in</Link>}
        {create}
      </div>
      <details className={styles.mobile} style={{ marginInlineStart: "auto" }}><summary>Menu</summary>
        <nav aria-label="Mobile navigation"><NavLinks />{user ? account : <Link href="/sign-in">Sign in</Link>}{create}</nav>
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
      <CharacterPortrait character={character} />
      <span className={styles.characterName}>{character.name}</span>
    </Link>
  )}</div>;
}

export function CharacterPortrait({ character, compact = false }: { character: Character; compact?: boolean }) {
  if (character.portrait) {
    return <Image className={styles.characterImage} src={character.portrait} alt="" width={450} height={290}
      sizes={compact ? "84px" : "(max-width: 720px) 50vw, 300px"} />;
  }
  return <div className={styles.portrait} style={{ "--character-color": character.color } as CSSProperties} aria-hidden="true">
    <span>{character.name.slice(0, 1)}</span>
  </div>;
}

export function PostList({ posts, roster, details = false }: { posts: Post[]; roster: Character[]; details?: boolean }) {
  return <ul className={styles.posts}>{posts.map((post) =>
    <li key={post.id}><Link className={`${styles.card} ${styles.post}`} href={`/posts/${post.id}`}>
      {(post.video || post.demo_video) && <span className={styles.poster}>
        {post.video && <Image unoptimized className={styles.clipFrame} src={`/posts/${post.id}/thumbnail`} alt="" width={320} height={180} />}
        <span className="sr-only">Video</span><span className={styles.playMark} aria-hidden="true">▶</span>
      </span>}
      <div>
        <h3>{post.title}</h3><p>{post.description}</p>
        <p className="muted">{roster.find((character) => character.slug === post.character)?.name ?? post.character} · {typeLabels[post.type]}
          {details && <> · {post.author} · {post.likes} likes · {post.dislikes} dislikes · {post.comments} comments</>}
        </p>
      </div>
    </Link></li>
  )}</ul>;
}
