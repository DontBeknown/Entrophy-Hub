insert into public.characters (slug, name, color) values
  ('ragna','Ragna','#ec407a'), ('noel','Noel','#4468ff'), ('jin','Jin','#7496ff'), ('hakumen','Hakumen','#9e88ed');

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','blade@example.invalid',now(),now(),now()),
  ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','kite@example.invalid',now(),now(),now())
on conflict (id) do nothing;

insert into public.profiles (id, display_name) values
  ('10000000-0000-4000-8000-000000000001','BladeSignal'),
  ('10000000-0000-4000-8000-000000000002','KiteFx')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.posts (id, author_id, character, type, title, description, body, published_at) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ragna','combo','Corner launcher route','Ragna combo for strong corner carry.',
   jsonb_build_object('sequence', E'Dash in | → → + D\nLaunch | ↑ + D\nAir follow-up | ↑ → + D','timing','Wait for the launch to connect before following up.'), now()),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','noel','build','Fast clear build (Stage 3+)','A consistent setup for fast clears.',
   '{"upgrades":"Prioritize reliable ranged damage.","tactics":"Keep your distance from crowds.","alternatives":"Choose mobility if a damage upgrade does not appear."}', now() - interval '1 hour'),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','jin','tactic','Make space before the boss wind-up','A simple approach to punishing slow attacks.',
   '{"situation":"When an enemy starts a long attack animation.","steps":"Move out of range.\nWait for the hit.\nPunish the recovery.","notes":"Keep an escape option available."}', now() - interval '2 hours'),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','hakumen','speedrun','Practice run with a flexible route','A recorded practice route for a first timed run.',
   '{"category":"Any%","time":"00:18:42","route":"Choose the shortest safe path through each stage."}', now() - interval '3 hours');
