"use client";

import { useActionState, useState } from "react";
import { savePost, type SaveResult } from "@/app/posts/actions";
import { postTypes, type Character, type Post, type PostType } from "@/lib/demo";
import { editorFields } from "@/lib/editor";

const names: Record<PostType, string> = { build: "Build", tactic: "Tactic", combo: "Combo", speedrun: "Speedrun" };

export function PostEditor({ roster, post, initialCharacter = "", initialType = "build" }: {
  roster: Character[]; post?: Post; initialCharacter?: string; initialType?: PostType;
}) {
  const [type, setType] = useState(post?.type ?? initialType);
  const [character, setCharacter] = useState(post?.character ?? initialCharacter);
  const [values, setValues] = useState<Record<string, string>>({
    title: post?.title ?? "", description: post?.description ?? "",
    version: post?.version ?? "", difficulty: post?.difficulty ?? "",
    ...Object.fromEntries(Object.entries(post?.body ?? {}).map(([key, value]) => [`${post?.type}:${key}`, value])),
  });
  const [result, action, pending] = useActionState<SaveResult, FormData>(savePost.bind(null, post?.id ?? null), {});
  function valueProps(key: string) {
    return { value: values[key] ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((previous) => ({ ...previous, [key]: value }));
    } };
  }
  return <form action={action} className="stack">
    <label>Post type<select name="type" value={type} disabled={Boolean(post)} onChange={(event) => setType(event.target.value as PostType)}>
      {postTypes.filter((entry) => entry !== "speedrun").map((entry) => <option value={entry} key={entry}>{names[entry]}</option>)}
    </select></label>
    {post && <input type="hidden" name="type" value={type} />}
    <label>Character<select name="character" value={character} onChange={(event) => setCharacter(event.target.value)} required>
      <option value="">Choose a character</option>
      {roster.map(({ slug, name }) => <option value={slug} key={slug}>{name}</option>)}
    </select></label>
    <label>Title<input name="title" maxLength={120} required {...valueProps("title")} /></label>
    <label>Description<textarea name="description" maxLength={4000} required {...valueProps("description")} /></label>
    {editorFields[type].map((field) => {
      const props = { id: `field-${field.key}`, name: field.key, required: field.required, maxLength: field.max ?? 4000, ...valueProps(`${type}:${field.key}`) };
      return <div key={field.key}><label htmlFor={props.id}>{field.label}</label>
        {field.hint && <small className="muted form-hint" id={`hint-${field.key}`}>{field.hint}</small>}
        {field.multiline ? <textarea {...props} aria-describedby={field.hint ? `hint-${field.key}` : undefined} />
          : <input {...props} aria-describedby={field.hint ? `hint-${field.key}` : undefined} />}
      </div>;
    })}
    <label>Game version (optional)<input name="version" maxLength={80} {...valueProps("version")} /></label>
    <label>Difficulty (optional)<input name="difficulty" maxLength={80} {...valueProps("difficulty")} /></label>
    {result.error && <p role="alert">{result.error}</p>}
    <button className="button" disabled={pending}>{post ? "Save changes" : "Publish post"}</button>
  </form>;
}
