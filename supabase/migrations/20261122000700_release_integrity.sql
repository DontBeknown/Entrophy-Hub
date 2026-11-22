alter table public.media_uploads add column poster_jpeg text
  check (char_length(poster_jpeg) between 32 and 65536 and poster_jpeg ~ '^/9j/[A-Za-z0-9+/]*={0,2}$');
grant insert (poster_jpeg) on public.media_uploads to authenticated;

create function public.public_video_poster(target uuid)
returns table (poster_jpeg text)
language sql stable security definer set search_path = '' as $$
  select m.poster_jpeg
  from public.posts p join public.media_uploads m on m.path = p.video
  where p.id = target and p.removed_at is null;
$$;
revoke all on function public.public_video_poster(uuid) from public;
grant execute on function public.public_video_poster(uuid) to anon, authenticated;

create or replace function public.validate_post_video()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  reservation public.media_uploads;
  bucket text;
  max_bytes bigint;
begin
  if new.type = 'speedrun' and new.video is null and new.removed_at is null
     and new.id <> '20000000-0000-4000-8000-000000000004' then
    raise exception 'A speedrun needs a recording' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.video is not distinct from old.video then
    return new;
  end if;
  if new.video is not null then
    if new.type not in ('combo','speedrun') or new.removed_at is not null then
      raise exception 'This post cannot have a video' using errcode = '23514';
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

create function public.lock_reporting_target()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.posts where id = new.post_id and removed_at is null for share;
  if not found or (new.comment_id is not null and not exists (
    select 1 from public.comments where id = new.comment_id and post_id = new.post_id and removed_at is null
  )) then
    raise exception 'The reported content is unavailable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.lock_reporting_target() from public;
create trigger lock_reporting_target before insert on public.reports
for each row execute function public.lock_reporting_target();

create or replace function public.review_report(report_id uuid, outcome text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  report public.reports;
  target_post uuid;
begin
  if not public.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  if outcome is null or outcome not in ('dismiss','remove') then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;
  select post_id into target_post from public.reports where id = report_id;
  -- Serialize decisions about the same post before locking or closing individual reports.
  perform 1 from public.posts where id = target_post for update;
  select * into report from public.reports where id = report_id for update;
  if not found or report.decision is not null then
    raise exception 'Report has already been reviewed' using errcode = 'P0002';
  end if;
  if outcome = 'remove' then
    if report.comment_id is null then
      update public.posts set removed_at = now(), video = null where id = report.post_id and removed_at is null;
    else
      update public.comments set body = null, removed_at = now() where id = report.comment_id and removed_at is null;
    end if;
  end if;
  update public.reports set decision = outcome, reviewed_by = (select auth.uid()), reviewed_at = now()
  where decision is null and (
    id = report_id or (outcome = 'remove' and (
      (report.comment_id is null and post_id = report.post_id) or comment_id = report.comment_id
    ))
  );
end;
$$;

update public.posts set video = null where removed_at is not null and video is not null;
update public.reports r set
  decision = 'remove',
  reviewed_at = coalesce(p.removed_at, (select c.removed_at from public.comments c where c.id = r.comment_id))
from public.posts p where p.id = r.post_id and r.decision is null
  and (p.removed_at is not null or exists (select 1 from public.comments c where c.id = r.comment_id and c.removed_at is not null));
