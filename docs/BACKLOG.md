# Project backlog

Built on 2026-11-17 from `HANDOFF.md`, `SANITY-PORT-STATUS.md`, `GO-LIVE-CHECKLIST.md`, `DECISIONS.md`, `SPEC.md` and `USER-NEEDS.md`. It only lists work those documents describe. When an item is done, tick it here and update the status file it came from.

Priority:
- **P0**: blocks the Sanity port; do in this order.
- **P1**: needed before the new site replaces Wix.
- **P2**: after launch, or when someone asks for it.

Owner: **D** = Dávid (accounts, decisions), **M** = maintainer/agent (code), **A** = admin.

## Where things stand

| Phase | State |
|---|---|
| Pages CMS proof of concept (`main`) | Done and live at davidpalfi.github.io/forro-bp-website. Pages CMS was connected on 2026-11-15 and judged unintuitive, so the project moved to Sanity. |
| Sanity decisions S1-S4 | Confirmed 2026-11-16 |
| Stage 1: Studio + schemas (`feature/sanity`) | Done and validated locally. Not deployed to Sanity hosting. |
| Migration, Sanity reads, preview, publish rebuild | Not started |
| Real content, admin trial, launch | Not started |

The public site still reads the JSON files. Nothing has been written to Sanity yet.

## P0: finish the Sanity port

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 1 | Check Sanity Free-plan limits (seats, roles, dataset visibility, Studio hosting, image usage) and record the findings with a date in `DECISIONS.md` | D | Findings recorded; no feature used needs Growth | none |
| 2 | Deploy the Studio (`npm run studio:deploy`) and open the hosted URL | D + M | Studio opens at `*.sanity.studio` with the maintainer's account | 1 |
| 3 | Test the invited-editor sign-in with a test invite | D | A non-developer account can sign in, on a phone too | 2 |
| 4 | Audit schema coverage: map every field under `src/content/` to a Sanity field (home intro and numbers line, program image order, phone banner image, page visibility and order, routing) | M | Mapping table written; gaps fixed in `studio/`, `DECISIONS.md`, `SPEC.md` | none (can run alongside 1-3) |
| 5 | Write the migration script: stable IDs, safe to re-run, dry-run report, image upload, keeps order, never deletes | M | Dry run and a repeat run against a throwaway dataset show the expected result | 4 |
| 6 | Run the migration into `production` after review | D + M | Document counts and sample bilingual records match `src/content/` | 5, 1 |
| 7 | Sanity read layer: GROQ queries and typed helpers; switch Astro pages from JSON while keeping routes, language fallback, safe links, metadata, ordering, `[content-warning]` handling | M | `npm run check` passes with parity tests; site looks the same at phone and desktop width | 6 |
| 8 | Render the page-builder blocks (heading, text, image, gallery, button, banner, columns, video, divider, people grid) and Sanity images with crop/focus point | M | Every block type renders in both languages | 7 |
| 9 | Decide hosting: Cloudflare for preview only, or for the public site as well | D | Decision recorded in `DECISIONS.md` | 1 |
| 10 | Click-to-edit preview: SSR on Cloudflare, preview only, secrets server-side, drafts never in public builds | M | Preview shows drafts; public build shows none | 7, 9 |
| 11 | Publish rebuild: choose provider and webhook; secrets only in provider settings | D + M | One publish triggers one rebuild; a failed build keeps the last good site; rollback tested | 7, 9 |
| 12 | Document the real environment variables, secret names, commands and rollback in `README.md` / `ARCHITECTURE.md` | M | Docs match what was built | 10, 11 |

## P1: before launch

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 13 | Admin trial: she signs in, edits a bilingual text, a person, a program image and a page block, previews and publishes, on desktop and phone. Watch, do not help | D + A | Her problems are written down and fixed, or the editor choice is reconsidered | 3, 10, 11 |
| 14 | Finish the admin editing guide (`docs/EDITING-GUIDE.md`) from the tested interface, with screenshots | M | She has read it on her phone | 13 |
| 15 | Real content: logo, banner photos (desktop and phone), program graphics, people photos, location photos, all bios, location text | A | No placeholders left | 6 or 13 |
| 16 | Hungarian gaps: code of conduct, artists heading, roles "Consent Facilitator" and "Music Teacher", ticket button label | A | All Hungarian fields filled | 15 |
| 17 | A native Hungarian speaker checks the fixed wording in `src/lib/i18n.ts` | A or D | Corrections made | none |
| 18 | Care-team names and phone numbers for the code of conduct: decide where they go without being public in the repo or dataset export | D + A | Decision recorded | 1 |
| 19 | Design sign-off on phone and desktop: fonts, justified vs left-aligned text, language switch (plain links vs flag drop-down) | A | Her approval recorded (AC16) | 8, 15 |
| 20 | Launch practicalities: domain registrar and access, Wix renewal date, who owns the accounts (ideally the admin or a community account), who gets build-failure alerts, public or private repository | D | Answers recorded in `DECISIONS.md` | none |
| 21 | Redirects from old Wix addresses; first find the exact Hungarian Wix addresses | M | Every old address lands on its new page, query strings kept where possible | 9, 20 |
| 22 | Decide what `/` shows: community home or festival home | D | Recorded | none |
| 23 | Final acceptance: clean install, `npm run check`, `npm run build`, schema checks, browser check at phone and desktop, preview, publish, rollback | M | All pass | 7-21 |
| 24 | Switch traffic: point the domain, check HTTPS and redirects, turn off `noindex` only when D approves, keep Wix until confirmed | D + M | New site live on the domain; one test edit publishes | 23 |
| 25 | Look at Wix visitor statistics (devices, top pages) before Wix is cancelled | D | Notes saved | before Wix ends |

## P2: after launch or on request

| # | Item | Owner | Notes |
|---|---|---|---|
| 26 | Community level: ask the admin what it should show (classes, parties, people, links) and how often it changes, then design it | D + A, then M | Deliberately empty for now (N7) |
| 27 | New block types from the admin's drawings | M | Do not guess blocks before her drawings arrive (S2) |
| 28 | Program as text as well as images, for screen readers and search | A / M | Optional text field exists in the PoC |
| 29 | Alt text on people photos | M | The Sanity person photo already has EN/HU alt fields; the rendering in item 8 should use them |
| 30 | Accessibility review and testing in browsers other than Chromium | M | Never done |
| 31 | Sitemap | M | Not specified yet |
| 32 | Decide whether to keep or retire the Pages CMS PoC and `.pages.yml` once Sanity is live | D | Keep it as the fallback until Sanity is stable |

## Open decisions to collect

- Hosting for preview and production (9)
- Rebuild provider and webhook (11)
- Launch practicalities (20)
- What `/` shows (22)
- Care-team contact details (18)
- Community level content (26)
