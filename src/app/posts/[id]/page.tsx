import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
import { Discussion } from "@/components/discussion";
import styles from "@/components/site.module.css";
import { type Post, typeLabels } from "@/lib/demo";
import { getCharacters, getPost, listUrl, type Query } from "@/lib/posts";

function BodySection({ title, value, ordered = false, nested = false }: {
  title: string; value?: string; ordered?: boolean; nested?: boolean;
}) {
  if (!value) return null;
  const Heading = nested ? "h3" : "h2";
  return <section>
    <Heading>{title}</Heading>
    {ordered ? <ol>{value.split(/\r?\n/).filter(Boolean).map((line, index) => <li key={index}>{line}</li>)}</ol>
      : <p className="prose">{value}</p>}
  </section>;
}

function Video({ post }: { post: Post }) {
  if (!post.video && !post.demo_video) return null;
  return <VideoPlayer postId={post.id} demo={!post.video} />;
}

function PostBody({ post }: { post: Post }) {
  const { body } = post;
  switch (post.type) {
    case "build": return <>
      <BodySection title="Priority upgrades" value={body.upgrades} />
      <BodySection title="Tactics" value={body.tactics} />
      <BodySection title="Alternatives" value={body.alternatives} />
    </>;
    case "tactic": return <>
      <BodySection title="Situation" value={body.situation} />
      <BodySection title="Steps" value={body.steps} ordered />
      <BodySection title="When to use it" value={body.notes} />
    </>;
    case "combo": return <div className={post.video || post.demo_video ? "combo-layout" : ""}>
      <Video post={post} />
      <section className="panel">
        <h2>Input sequence</h2>
        <ol className="input-sequence">{body.sequence?.split(/\r?\n/).filter(Boolean).map((step, index) => {
          const [name, inputs] = step.split("|", 2);
          return <li key={index}><span>{name.trim()}</span>
            {inputs && <span className="keycaps">{inputs.trim().split(/\s+/).map((key, keyIndex) =>
              key === "+" ? <span key={keyIndex}>+</span> : <kbd key={keyIndex}>{key}</kbd>)}</span>}
          </li>;
        })}</ol>
        <BodySection title="Timing and positioning" value={body.timing} nested />
        <BodySection title="Required upgrades" value={body.upgrades} nested />
      </section>
    </div>;
    case "speedrun": return <>
      <Video post={post} />
      <section className="panel"><h2>Run summary</h2>
        <p>{body.category} · <time>{body.time}</time> <span className="muted">(self-reported)</span></p>
      </section>
      <BodySection title="Route notes" value={body.route} />
    </>;
  }
}

export default async function PostDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const { id } = await params;
  const [post, roster] = await Promise.all([getPost(id), getCharacters()]);
  if (!post) notFound();
  const name = roster.find((character) => character.slug === post.character)?.name ?? post.character;
  return <article className="container page stack">
    <nav aria-label="Breadcrumb" className="row">
      <Link href="/characters">Characters</Link><span aria-hidden="true">/</span>
      <Link href={`/characters/${post.character}`}>{name}</Link><span aria-hidden="true">/</span>
      <Link href={listUrl(`/characters/${post.character}`, { type: post.type })}>{typeLabels[post.type]}</Link>
    </nav>
    <header>
      <h1 className={styles.rule}>{post.title}</h1>
      <p className="muted">{post.author} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(post.published_at))}
        {post.version && ` · Version ${post.version}`}{post.difficulty && ` · ${post.difficulty}`}</p>
      <p className="prose">{post.description}</p>
    </header>
    <PostBody post={post} />
    <Discussion post={post} query={await searchParams} />
  </article>;
}
