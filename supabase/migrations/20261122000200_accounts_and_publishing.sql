create function public.create_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 40), ''), 'Player'));
  return new;
end;
$$;
revoke all on function public.create_member_profile() from public;
create trigger create_member_profile after insert on auth.users
for each row execute function public.create_member_profile();

create function public.validate_post_body()
returns trigger language plpgsql set search_path = '' as $$
declare
  required_keys text[];
  field_value jsonb;
begin
  required_keys := case new.type
    when 'build' then array['upgrades', 'tactics', 'alternatives']
    when 'tactic' then array['situation', 'steps']
    when 'combo' then array['sequence']
    when 'speedrun' then array['category', 'time']
  end;
  if exists (
    select 1 from unnest(required_keys) as field(key)
    where nullif(btrim(new.body ->> field.key), '') is null
  ) then
    raise exception 'Complete the required post fields' using errcode = '23514';
  end if;
  for field_value in select value from jsonb_each(new.body)
  loop
    if jsonb_typeof(field_value) <> 'string' or char_length(field_value #>> '{}') > 4000 then
      raise exception 'Invalid post field' using errcode = '23514';
    end if;
  end loop;
  if new.type = 'speedrun' and (new.body ->> 'time') !~ '^[0-9]{2,3}:[0-5][0-9]:[0-5][0-9]$' then
    raise exception 'Enter a time in HH:MM:SS format' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_post_body before insert or update of type, body on public.posts
for each row execute function public.validate_post_body();

grant insert (author_id, character, type, title, description, version, difficulty, body) on public.posts to authenticated;
grant update (character, title, description, version, difficulty, body) on public.posts to authenticated;
create policy "Members can create their own posts" on public.posts for insert to authenticated
with check (author_id = (select auth.uid()) and type <> 'speedrun');
create policy "Members can edit their own visible posts" on public.posts for update to authenticated
using (author_id = (select auth.uid()) and removed_at is null and type <> 'speedrun')
with check (author_id = (select auth.uid()) and removed_at is null and type <> 'speedrun');
