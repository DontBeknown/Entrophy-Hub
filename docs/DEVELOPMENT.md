# Developing Entropy Hub

See the [project overview](../README.md) for a tour of the site.

## Local setup

Use Node.js 24, pnpm 10, and Docker.

```sh
pnpm install --frozen-lockfile
pnpm dlx supabase@3.2.0 start
pnpm dlx supabase@3.2.0 status
```

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` from the local Supabase status output. The secret key is server-only. Keep `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000` for the default dev server. Use the exact URL configured in `NEXT_PUBLIC_APP_URL` when signing up so the browser sends the signup cookie to the confirmation callback. Leave `NEXT_PUBLIC_SUPABASE_STORAGE_URL` empty for the local stack.

```sh
pnpm dev
```

Open [Entropy Hub](http://127.0.0.1:3000) and [Mailpit](http://127.0.0.1:54324) in the same browser profile to confirm local sign-ups. If the confirmation link reports an error, try signing in with your password. Supabase may have already confirmed the address before the app could start your session. Without Supabase configuration, the public pages use demo fixtures and account features are unavailable.

## Verification

```sh
pnpm exec playwright install chromium
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

The browser tests use port 3211 and local seeded data. Account, upload, and moderation tests are enabled only when the Supabase URL points to the local stack and a local secret key is available. Use `pnpm dlx supabase@3.2.0 db reset` to rebuild a disposable development database from the migrations and demo seed.

## Staging and production

1. Create separate Supabase projects and Next.js deployments. Use a Supabase tier that supports 2 GiB files. Set the global Storage limit to at least 2 GiB and keep the buckets private. Migrations configure each bucket for MP4 and set the individual limits to 50 MiB for combo clips and 2 GiB for speedrun recordings. [Supabase file limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
2. Apply `supabase/migrations` to each linked project with `supabase db push`. Leave out the local-only `supabase/seed.sql` in production. The roster is installed by a migration. Portrait paths can point to approved assets under `public/portraits/`. Entries without artwork show their name and an initial. [Steam game listing](https://store.steampowered.com/app/2273430/BlazBlue_Entropy_Effect/) · [Prototype roster](https://blazblue.wiki/wiki/BlazBlue_Entropy_Effect/Prototypes)
3. Set the variables in `.env.example` per deployment. Use the real app origin for `NEXT_PUBLIC_APP_URL`. The app derives the hosted direct-upload hostname from the Supabase URL. Set `NEXT_PUBLIC_SUPABASE_STORAGE_URL` when using a different storage origin. [Supabase resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
4. Enable email confirmations in Supabase Auth, set the site URL, allowlist the exact `/auth/callback` URL, and configure SMTP. Keep the confirmation link template enabled. Members should open the confirmation link in the browser where they signed up.
5. Assign moderator access by inserting the verified member ID in the SQL editor.

   ```sql
   insert into public.moderators (user_id) values ('replace-with-member-uuid');
   ```

6. Set a deployment-specific `CRON_SECRET`. Vercel reads `vercel.json` and sends the secret as a bearer token on production deployments. Invoke the route with that token when testing a staging preview. On another host, schedule an authenticated `GET /api/cleanup-uploads` once per day. Cleanup removes unattached uploads after their 24-hour grace period in batches of 100. Previously issued playback URLs expire after 15 minutes. [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
7. Smoke-test email delivery, create and edit, a recording over 50 MiB, seeking, reporting, and removal on staging before deploying to production. After rollout, review application errors, Auth delivery, Storage capacity, egress, and cleanup route failures.

The built-in ImageGen tool created the hero artwork from a prompt for diagonal violet, electric blue, and rose crystal shards on an ink-violet background. The local demo animation uses the same artwork. Uploaded recordings use a frame captured from the video when the browser can generate one.
