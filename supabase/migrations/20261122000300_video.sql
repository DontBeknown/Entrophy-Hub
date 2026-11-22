insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('combo-clips','combo-clips',false,52428800,array['video/mp4']),
       ('speedrun-recordings','speedrun-recordings',false,2147483648,array['video/mp4']);

create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  purpose public.post_type not null check (purpose in ('combo','speedrun')),
  path text generated always as (owner_id::text || '/' || id::text || '.mp4') stored unique,
  attached boolean not null default false,
  purging boolean not null default false,
  expires_at timestamptz not null default now() + interval '24 hours'
);

alter table public.media_uploads enable row level security;
revoke all on public.media_uploads from anon, authenticated;
grant select on public.media_uploads to authenticated;
grant insert (purpose) on public.media_uploads to authenticated;
create policy "Members can see their upload reservations" on public.media_uploads
for select to authenticated using (owner_id = (select auth.uid()));
create policy "Members can reserve an upload" on public.media_uploads
for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "Upload to an active reservation" on storage.objects
for insert to authenticated with check (
  exists (
    select 1 from public.media_uploads m
    where m.path = name and m.owner_id = (select auth.uid())
    and not m.attached and not m.purging and m.expires_at > now()
    and bucket_id = case m.purpose when 'combo' then 'combo-clips' else 'speedrun-recordings' end
  )
);

alter table public.posts add column video text unique references public.media_uploads(path);
grant insert (video), update (video) on public.posts to authenticated;

create function public.validate_post_video()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  reservation public.media_uploads;
  bucket text;
  max_bytes bigint;
begin
  if new.type = 'speedrun' and new.video is null
     and new.id <> '20000000-0000-4000-8000-000000000004' then
    raise exception 'A speedrun needs a recording' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.video is not distinct from old.video then
    return new;
  end if;
  if new.video is not null then
    if new.type not in ('combo','speedrun') then
      raise exception 'This post type cannot have a video' using errcode = '23514';
    end if;
    select * into reservation from public.media_uploads where path = new.video for update;
    if not found or reservation.owner_id <> new.author_id or reservation.purpose <> new.type
       or reservation.attached or reservation.purging or reservation.expires_at <= now() then
      raise exception 'Invalid upload reservation' using errcode = '23514';
    end if;
    bucket := case new.type when 'combo' then 'combo-clips' else 'speedrun-recordings' end;
    max_bytes := case new.type when 'combo' then 52428800 else 2147483648 end;
    if not exists (
      select 1 from storage.objects
      where bucket_id = bucket and name = new.video and metadata ->> 'mimetype' = 'video/mp4'
        and (metadata ->> 'size')::bigint between 1 and max_bytes
    ) then
      raise exception 'The uploaded recording is missing or invalid' using errcode = '23514';
    end if;
    update public.media_uploads set attached = true where id = reservation.id;
  end if;
  if tg_op = 'UPDATE' and old.video is not null then
    update public.media_uploads set attached = false, expires_at = now() + interval '24 hours' where path = old.video;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_post_video() from public;
create trigger validate_post_video before insert or update of video on public.posts
for each row execute function public.validate_post_video();

drop policy "Members can create their own posts" on public.posts;
create policy "Members can create their own posts" on public.posts for insert to authenticated
with check (author_id = (select auth.uid()));
drop policy "Members can edit their own visible posts" on public.posts;
create policy "Members can edit their own visible posts" on public.posts for update to authenticated
using (author_id = (select auth.uid()) and removed_at is null)
with check (author_id = (select auth.uid()) and removed_at is null);

create or replace view public.post_summaries with (security_invoker = true) as
select p.id, p.author_id, p.character, p.type, p.title, p.description, p.version, p.difficulty,
       p.body, p.search_text, p.published_at, profile.display_name as author,
       0::bigint as likes, 0::bigint as dislikes, 0::bigint as comments, p.video,
       p.id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004') as demo_video
from public.posts p join public.profiles profile on profile.id = p.author_id
where p.removed_at is null;

create function public.claim_expired_uploads()
returns table (id uuid, purpose public.post_type, path text)
language sql security invoker set search_path = '' as $$
  with expired as (
    select m.id from public.media_uploads m
    where not m.attached and m.expires_at < now()
    order by m.expires_at, m.id limit 100 for update skip locked
  )
  update public.media_uploads m set purging = true from expired
  where m.id = expired.id returning m.id, m.purpose, m.path;
$$;
revoke all on function public.claim_expired_uploads() from public, anon, authenticated;
grant execute on function public.claim_expired_uploads() to service_role;
