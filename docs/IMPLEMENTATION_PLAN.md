# Entropy Hub implementation phases

The [product brief](PRODUCT_BRIEF.md) defines the release scope. The [UI design](UI_DESIGN.md) and [mockup](UI_MOCKUP.png) define the responsive layout. Each phase carries its own verification and commit.

| Phase | Deliverable | Verification |
| --- | --- | --- |
| 1. Responsive home | Next.js, shared navigation, design tokens, artwork, and home fixtures | Desktop and phone navigation and layout |
| 2. Discovery | Supabase data, roster, character tabs, browse search, and four post layouts | Combined filters, empty results, browser Back, and detail navigation |
| 3. Accounts and publishing | Confirmation, sign-in return, dynamic editor, and My posts | Mailpit confirmation, field validation, publish, edit, and ownership |
| 4. Video | Private Storage, resumable uploads, signed playback, and cleanup | Required speedrun recording, interrupted large upload, byte-range playback, and replacement safety |
| 5. Discussion | Like/dislike, counts, one-level replies, and sign-in prompts | Reaction persistence and uniqueness, switching, clearing, and posting replies |
| 6. Moderation | Reports, private queue, dismiss/remove, and audit fields | Access control, confirmation, retained replies, and concurrent review |
| 7. Release prep | Launch roster, accessibility checks, scheduler, and deployment instructions | Full local suite, then staging smoke test before public rollout |

Run lint, type checking, the production build, and the browser suite before each phase commit. The [developer guide](DEVELOPMENT.md) contains the local and hosted setup steps.

## Commit sequence

1. `feat: scaffold Entropy Hub and build the responsive home page`
2. `feat: add character discovery search and post detail pages`
3. `feat: add accounts and post publishing`
4. `feat: add resumable video uploads and speedrun publishing`
5. `feat: add post reactions and discussion`
6. `feat: add content reporting and moderator review`
7. `chore: verify and prepare the first release`
