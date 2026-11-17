# Project backlog

Built on 2026-11-17 from `HANDOFF.md`, `SANITY-PORT-STATUS.md`, `GO-LIVE-CHECKLIST.md`, `DECISIONS.md`, `SPEC.md` and `USER-NEEDS.md`. It only lists work those documents describe. When an item is done, tick it here and update the status file it came from.

Priority:
- **P0**: blocks the Sanity port; do in this order.
- **P1**: needed before the new site replaces Wix.
- **P2**: after launch, or when someone asks for it.

Owner: **D** = Dávid (accounts, decisions), **M** = maintainer/agent (code), **A** = admin.

## Where things stand (updated 2026-11-17, evening)

| Phase | State |
|---|---|
| Pages CMS proof of concept (`main`) | Done and live at davidpalfi.github.io/forro-bp-website |
| Sanity decisions S1-S4 | Confirmed 2026-11-16 |
| Sanity proof of concept: schemas, site reading Sanity documents, migration, admin guide | **Built and tested offline** (S5-S7). Not yet run against the real Sanity project |
| Studio online, content imported | Waiting for Dávid: three commands (`SANITY-PORT-STATUS.md`, "Next steps") |
| Preview, rebuild on publish, hosting | Not started |
| Real content, admin trial, launch | Not started |

## P0: finish the Sanity port

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 1 | Check Sanity Free-plan limits (seats, roles, dataset visibility, Studio hosting, image usage) and record the findings with a date in `DECISIONS.md` | D | Findings recorded; no feature used needs Growth | none |
| 2 | Deploy the Studio (`npm run studio:deploy`) and open the hosted URL. **Ready to run**: address set to forro-budapest | D | Studio opens at `*.sanity.studio` with the maintainer's account | 1 |
| 3 | Test the invited-editor sign-in with a test invite | D | A non-developer account can sign in, on a phone too | 2 |
| 4 | ✅ **Done 2026-11-17.** Audit schema coverage: every JSON field mapped (`SPEC.md` 11.2), gaps fixed (S5), checked automatically by `npm run check` [0] | M | | |
| 5 | ✅ **Done 2026-11-17** (offline). Import file + `npm run sanity:import --missing`: fixed ids, repeatable, report, photo upload, order kept, never deletes (S7). Not yet tried against a real dataset | M | | |
| 6 | Run `npm run sanity:import` into `production` | D | 20 documents and 6 photos in Sanity; `CONTENT_SOURCE=sanity npm run build` passes and looks the same | 1, 2 |
| 7 | ✅ **Done 2026-11-17.** Sanity read layer (`CONTENT_SOURCE`); routes, fallback, safe links, metadata, ordering, warnings kept; parity proven by `npm run check` [5]. Still to do: switch the default to `sanity` after item 6 | M | | |
| 8 | ✅ **Done 2026-11-17.** All ten blocks and Sanity photos with crop and focus point, tested by `npm run check` [6] and in a browser | M | | |
| 9 | Decide hosting: Cloudflare for preview only, or for the public site as well | D | Decision recorded in `DECISIONS.md` | 1 |
| 10 | Click-to-edit preview: SSR on Cloudflare, preview only, secrets server-side, drafts never in public builds | M | Preview shows drafts; public build shows none | 7, 9 |
| 11 | Publish rebuild: choose provider and webhook; secrets only in provider settings | D + M | One publish triggers one rebuild; a failed build keeps the last good site; rollback tested | 7, 9 |
| 12 | Document the real environment variables, secret names, commands and rollback in `README.md` / `ARCHITECTURE.md` | M | Docs match what was built | 10, 11 |

## P1: before launch

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 13 | Admin trial: she signs in, edits a bilingual text, a person, a program image and a page block, previews and publishes, on desktop and phone. Watch, do not help | D + A | Her problems are written down and fixed, or the editor choice is reconsidered | 3, 10, 11 |
| 14 | Admin guide **written** (`docs/EDITING-GUIDE.md`); check it against the deployed Studio, add screenshots, then send | M | She has read it on her phone | 2 |
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
