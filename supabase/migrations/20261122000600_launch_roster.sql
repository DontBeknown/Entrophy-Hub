alter table public.characters add column portrait text
  check (portrait ~ '^/portraits/[a-z0-9-]+\.(avif|webp|png|jpg)$');

insert into public.characters (slug, name, color) values
  ('ragna','Ragna','#ec407a'),
  ('noel','Noel','#4468ff'),
  ('jin','Jin','#7496ff'),
  ('hakumen','Hakumen','#9e88ed'),
  ('hibiki','Hibiki Kohaku','#7280ad'),
  ('lambda-11','Lambda-11','#bc87e5'),
  ('es','Es','#5a8ce8'),
  ('taokaka','Taokaka','#d69158'),
  ('kokonoe','Kokonoe','#cf74c0'),
  ('mai','Mai Natsume','#ed6a8c'),
  ('rachel','Rachel Alucard','#bf5c89'),
  ('hazama','Hazama','#68b195'),
  ('icey','ICEY','#55b5da'),
  ('bullet','Bullet','#c37262'),
  ('the-prisoner','The Prisoner','#ef784f'),
  ('naoto','Naoto Kurogane','#a978e5'),
  ('platinum','Platinum the Trinity','#ef99c5')
on conflict (slug) do nothing;
