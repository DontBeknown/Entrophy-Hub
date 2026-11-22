create type public.post_type as enum ('build', 'tactic', 'combo', 'speedrun');

create table public.characters (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$')
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint posts_author_id_fkey references public.profiles(id) on delete cascade,
  character text not null references public.characters(slug),
  type public.post_type not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  version text check (char_length(version) <= 80),
  difficulty text check (char_length(difficulty) <= 80),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  search_text text generated always as (title || ' ' || description) stored,
  published_at timestamptz not null default now(),
  removed_at timestamptz
);

create index posts_recent_idx on public.posts (published_at desc, id desc) where removed_at is null;
create index posts_character_idx on public.posts (character, type, published_at desc) where removed_at is null;

alter table public.characters enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
revoke all on public.characters, public.profiles, public.posts from anon, authenticated;
grant select on public.characters, public.profiles, public.posts to anon, authenticated;
create policy "Anyone can see characters" on public.characters for select using (true);
create policy "Anyone can see display names" on public.profiles for select using (true);
create policy "Anyone can see published posts" on public.posts for select using (removed_at is null);

create view public.post_summaries with (security_invoker = true) as
select p.id, p.author_id, p.character, p.type, p.title, p.description, p.version, p.difficulty,
       p.body, p.search_text, p.published_at, profile.display_name as author,
       0::bigint as likes, 0::bigint as dislikes, 0::bigint as comments,
       null::text as video,
       p.id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004') as demo_video
from public.posts p join public.profiles profile on profile.id = p.author_id
where p.removed_at is null;

grant select on public.post_summaries to anon, authenticated;
