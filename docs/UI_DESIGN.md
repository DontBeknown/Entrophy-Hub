# Entropy Hub web design

**Entropy Hub** is the proposed name for the unofficial BlazBlue Entropy Effect community site. [The visual mockup](UI_MOCKUP.png) shows the desktop homepage and the combo page at desktop and phone widths. Its illustrations, posts, and combo inputs are sample content. The layouts below extend the [product brief](PRODUCT_BRIEF.md).

## Visual direction

Use an ink-violet background, matte cards, and angular artwork around the homepage and media thumbnails. Give guides and discussion quieter surfaces with room for long posts. Use **Russo One** for page titles, **Inter** for body text and controls, and a system monospace for input notation and run times. Body copy starts at 16 px with 1.5 line height.

| Role | Color | Use |
| --- | --- | --- |
| Page | `#0F0F23` | Site background |
| Surface | `#1E1C35` | Cards, input sequence, discussion |
| Text | `#E2E8F0` | Titles, body, and labels |
| Muted text | `#94A3B8` | Author, date, and optional metadata |
| Primary action | `#7C3AED` with `#FFFFFF` | Create post, publish, and the homepage character button |
| Selection and focus | `#A78BFA` | Selected tab underline and offset focus outline |
| Control outline | `#72728A` | Fields and outlined controls on dark surfaces |
| Decorative accent | `#F43F5E` | Hero artwork and short heading rules |

Use 8 px card corners and a spacing scale of 8, 16, 24, 32, and 48 px. On desktop, cap the main layout at 1200 px and keep long paragraphs near 70 characters per line. On phones, use 16 px gutters and let filter labels wrap. Artwork stays static, video starts on demand, and short control transitions respect reduced-motion preferences.

## Pages and layout

| Page | Desktop layout | Phone layout |
| --- | --- | --- |
| **Home** | Search and **Choose a character** on the left of an illustrated hero. A character grid and recent posts follow. | Search and character selection lead. Character cards use two columns and recent posts use one. |
| **Characters** | A roster search above a grid of portrait cards with visible names. | Search above a two-column grid. Each card opens the full character page. |
| **Character detail** | Name and compact portrait above **All**, **Builds**, **Tactics**, **Combos**, and **Speedruns**. Sorting and **Create post** sit beside the list controls. | The same content types wrap as needed. The post list runs in one column. **Create post** carries the selected character into the form. |
| **Browse** | Search above a filter column and results list. Each result shows its character, post type, and a thumbnail if it has video. | Search, a **Filters** button with the number of active filters, and a single results column. Show a **Clear filters** action if nothing matches. |
| **Post detail** | Breadcrumb, title, author, and type-specific content. For a combo, give the video about three fifths of the available space and the input list the rest. Put reactions and discussion below. | Title and metadata, main content, reactions, and discussion. A combo puts the video above the inputs. |
| **Create or edit** | A centered form. Choose the post type and character first, then fill in the relevant fields. Put the upload near the combo or run information it supports. | Use the same order in one column. Keep format and size limits by the file picker and show upload progress or retry inline. |
| **Sign in and My posts** | A focused sign-in form. My posts shows a list of contributions and **View** and **Edit** actions. | Full-width form and stacked post rows. After sign-in, return to the page or action that prompted it. |
| **Moderator reports** | A private queue shows each report reason, a link to the content in context, and the available actions. | Stack reports as cards and ask for confirmation before removing content. |

On desktop, the wordmark links home and the header shows **Characters**, **Browse**, **Sign in** or the account menu, and **Create post**. On phones, use a labeled menu. Preserve the search, filters, and selected tab when a player returns from a post.

## Post content and controls

- **Build** leads with how it plays, then priority upgrades, tactics, and alternatives. **Tactic** leads with the boss or situation, then shows the steps and when to use them.
- **Combo** pairs readable action names with input keycaps and short timing notes. The written sequence occupies the main content area when there's no clip.
- **Speedrun** leads with the recording, category, and self-reported time. Route notes follow for players who want to learn the run.
- **Like** and **Dislike** are labeled buttons with counts and a visible selected state. The discussion shows comments and replies with a clear **Reply** action.
- Attachments show a file name, progress, and a retry action. An upload error preserves the author's text and explains what they can do next.
- Give important controls visible keyboard focus and aim for 44 px touch targets. Pair color with a label, icon, or underline for selection and errors.
