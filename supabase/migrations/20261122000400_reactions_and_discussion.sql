create table public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  parent_id uuid,
  body text check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (id, post_id),
  foreign key (parent_id, post_id) references public.comments(id, post_id) on delete cascade,
  check ((body is null) = (removed_at is not null))
);
create index comments_post_and_parent_idx on public.comments(post_id, parent_id, created_at, id);
create index comments_parent_idx on public.comments(parent_id) where parent_id is not null;

alter table public.reactions enable row level security;
alter table public.comments enable row level security;
revoke all on public.reactions, public.comments from anon, authenticated;
grant select, delete on public.reactions to authenticated;
grant insert (post_id, user_id, value), update (value) on public.reactions to authenticated;
grant select on public.comments to anon, authenticated;
grant insert (post_id, parent_id, body) on public.comments to authenticated;

create policy "Members can read their reactions" on public.reactions for select to authenticated
using (user_id = (select auth.uid()));
create policy "Members can add reactions to public posts" on public.reactions for insert to authenticated
with check (user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null));
create policy "Members can update their reactions" on public.reactions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null));
create policy "Members can remove their reactions" on public.reactions for delete to authenticated
using (user_id = (select auth.uid()));

create function public.set_reaction(target uuid, reaction smallint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if reaction = 0 then
    delete from public.reactions where post_id = target and user_id = (select auth.uid());
  else
    insert into public.reactions (post_id, user_id, value) values (target, (select auth.uid()), reaction)
    on conflict (post_id, user_id) do update set value = excluded.value;
  end if;
end;
$$;
revoke all on function public.set_reaction(uuid, smallint) from public;
grant execute on function public.set_reaction(uuid, smallint) to authenticated;

create policy "Anyone can read discussion on visible posts" on public.comments for select
using (exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null));
create policy "Members can comment on visible posts" on public.comments for insert to authenticated
with check (author_id = (select auth.uid()) and body is not null
  and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null));

create function public.validate_comment_parent()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.comments
    where id = new.parent_id and post_id = new.post_id and parent_id is null and removed_at is null
  ) then
    raise exception 'Reply to a visible top-level comment' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_comment_parent before insert on public.comments
for each row execute function public.validate_comment_parent();

create function public.post_activity(post uuid)
returns table (likes bigint, dislikes bigint, comments bigint)
language sql stable security definer set search_path = '' as $$
  select count(*) filter (where r.value = 1), count(*) filter (where r.value = -1),
    (select count(*) from public.comments c where c.post_id = post and c.removed_at is null)
  from public.reactions r where r.post_id = post
  having exists (select 1 from public.posts p where p.id = post and p.removed_at is null);
$$;
revoke all on function public.post_activity(uuid) from public;
grant execute on function public.post_activity(uuid) to anon, authenticated;

create or replace view public.post_summaries with (security_invoker = true) as
select p.id, p.author_id, p.character, p.type, p.title, p.description, p.version, p.difficulty,
       p.body, p.search_text, p.published_at, profile.display_name as author,
       stats.likes, stats.dislikes, stats.comments, p.video,
       p.id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004') as demo_video
from public.posts p join public.profiles profile on profile.id = p.author_id
cross join lateral public.post_activity(p.id) stats
where p.removed_at is null;
