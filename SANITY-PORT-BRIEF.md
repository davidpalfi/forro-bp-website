# Brief: port the site to Sanity on `feature/sanity`

Written 2026-11-15 from a planning conversation with Dávid (repo owner). This is a brief for a Claude Code session working in `davidpalfi/forro-bp-website`. Read `docs/HANDOFF.md` and `docs/DECISIONS.md` first; this brief changes several decisions recorded there.

**Do not start building until Dávid confirms.** He asked to review the plan first.

## Why this change

- The PoC is live at https://davidpalfi.github.io/forro-bp-website/ and Pages CMS was connected on 2026-11-15.
- Dávid found the Pages CMS forms unintuitive. The admin is a designer who built the current site in Wix, so forms that are detached from the page are a poor fit for her.
- The only hard rule is now **no subscription**. Dávid no longer minds where the content lives, which removes the earlier objection to Sanity.
- Goal: the best editing experience for the admin that costs nothing. Sanity with click-to-edit (Presentation tool) was chosen over TinaCMS (visual editing on Astro is experimental) and Storyblok (free tier too small).

## Division of work

- Design and layout changes: the admin gives drawings, Dávid builds them with Claude.
- Content: the admin edits in Sanity.

## Scope

Create branch `feature/sanity` from `main` and port the whole site. `main`, the GitHub Pages PoC and the Pages CMS config stay untouched.

1. **Sanity content model** matching today's content: festival settings, site settings, community settings, people (teachers and artists), text pages, program images.
2. **Migration script** that imports the current JSON content from `src/content` into Sanity.
3. **Pages read from Sanity** instead of the JSON files. Design and templates stay the same.
4. **Click-to-edit preview:** Sanity's visual editing needs server-side rendering in Astro (static output does not work). Use a server-rendered preview deployed on Cloudflare (free); keep the public site static.
5. **Publish trigger:** a Sanity webhook rebuilds the site when she publishes.
6. **Docs:** update `DECISIONS.md`, `ARCHITECTURE.md`, `HANDOFF.md`, `SPEC.md`, and write a new `EDITING-GUIDE.md` for Sanity.

## Choices proposed to Dávid (not yet confirmed)

- **Languages:** keep English and Hungarian side by side in each entry (`title_en`, `title_hu`), with the existing fall-back to the other language.
- **Blocks:** the home page and text pages become lists of blocks she can add, reorder and remove (text, image, button, gallery). People and settings stay fixed fields.
- **Studio:** hosted by Sanity at its own address, not embedded in the site.
- **Photos:** served from Sanity's image service (gives her cropping). This drops decision 10's "no third-party requests" rule and replaces the custom resize step (decision 9).

## Decisions in `DECISIONS.md` this reverses or changes

- 1 (static only): the public site stays static, but an SSR preview is added.
- 3 (Pages CMS, content as files in GitHub): replaced by Sanity.
- 6 (fixed content types, no free blocks): partly relaxed for the home and text pages.
- 9 and 10 (own photo resize, no third-party requests): replaced if photos come from Sanity.
- 13 (GitHub Pages hosting): Cloudflare for the preview, and likely for launch.
- 17 (text bodies as JSON rendered with `marked`): replaced by Sanity's rich text.

## What Dávid has to provide

- A free Sanity account and project: project ID and dataset name (not secret).
- A free Cloudflare account connected to the repo, once the code is ready.
- Tokens (Sanity API read token, Cloudflare settings) go into GitHub and Cloudflare secrets, never into chat or the repo.

Without these the code can be written and built, but click-to-edit cannot be tested against a real project.

## Things to verify, not assume

- Sanity's current free plan: seats, roles, public or private dataset, whether visual editing is included. It was last checked around 2026-11-11 (20 seats, two roles, public dataset, visual editing listed as included); the pricing page could not be re-read on 2026-11-15.
- The current `@sanity/astro` setup for visual editing; read Sanity's "Visual Editing with Astro" guide before writing code.
- How the admin's sign-in works by email invitation, and how usable the editor is on a phone. Click-to-edit is a desktop experience; on a phone she would use Sanity's forms.

## Constraints that still hold

- No subscription and no paid accounts for the admin.
- The repo stays under Dávid's personal GitHub account as a sandbox for now; no community organisation yet.
- The repo is public: keep private details out (the care team's names and phone numbers were left out of the code of conduct on purpose).
- The admin's acceptance test: she tries the editor herself before anything replaces the current PoC.
