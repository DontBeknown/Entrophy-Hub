create table public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.moderators enable row level security;
revoke all on public.moderators from anon, authenticated;

create function public.is_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  comment_id uuid,
  reporter_id uuid references auth.users(id) on delete set null default auth.uid(),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  decision text check (decision in ('dismiss','remove')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  foreign key (comment_id, post_id) references public.comments(id, post_id) on delete cascade
);
create unique index pending_post_report_idx on public.reports(reporter_id, post_id)
where decision is null and comment_id is null;
create unique index pending_comment_report_idx on public.reports(reporter_id, comment_id)
where decision is null and comment_id is not null;
create index report_queue_idx on public.reports(created_at, id) where decision is null;

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (post_id, comment_id, reason) on public.reports to authenticated;
create policy "Moderators can read reports" on public.reports for select to authenticated
using ((select public.is_moderator()));
create policy "Members can report visible content" on public.reports for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null)
  and (comment_id is null or exists (select 1 from public.comments c where c.id = comment_id and c.removed_at is null))
);

create function public.review_report(report_id uuid, outcome text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  report public.reports;
begin
  if not public.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  if outcome is null or outcome not in ('dismiss','remove') then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;
  select * into report from public.reports where id = report_id for update;
  if not found or report.decision is not null then
    raise exception 'Report has already been reviewed' using errcode = 'P0002';
  end if;
  if outcome = 'remove' then
    if report.comment_id is null then
      update public.posts set removed_at = now() where id = report.post_id and removed_at is null;
    else
      update public.comments set body = null, removed_at = now() where id = report.comment_id and removed_at is null;
    end if;
  end if;
  update public.reports set decision = outcome, reviewed_by = (select auth.uid()), reviewed_at = now() where id = report_id;
end;
$$;
revoke all on function public.review_report(uuid, text) from public;
grant execute on function public.review_report(uuid, text) to authenticated;
