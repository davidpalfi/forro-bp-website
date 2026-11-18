# Project backlog

Built on 2026-11-17 from `HANDOFF.md`, `SANITY-PORT-STATUS.md`, `GO-LIVE-CHECKLIST.md`, `DECISIONS.md`, `SPEC.md` and `USER-NEEDS.md`. It only lists work those documents describe. When an item is done, tick it here and update the status file it came from.

Priority:
- **P0**: blocks the Sanity port; do in this order.
- **P1**: needed before the new site replaces Wix.
- **P2**: after launch, or when someone asks for it.

Owner: **D** = Dávid (accounts, decisions), **M** = maintainer/agent (code), **A** = admin.

## ▶ Next task for the next agent: click-to-edit, first on Dávid's computer

> **Status 2026-11-18 (evening): built, waiting for Dávid's verdict.** Everything below the line was the brief; it is done as described in `DECISIONS.md` S9 and `SPEC.md` 11.7, except the try itself. Dávid's steps are in `SANITY-PORT-STATUS.md`, "Next steps". If he says click-to-edit is clearly better than forms: next is item 9 and hosting the preview (item 10, second half). If not: reconsider the editor with him (S8).

---

**Why this is next (2026-11-18).** Dávid looked at the Sanity editor and found it still feels like the Pages CMS forms, which is true: the reason for moving to Sanity (USER-NEEDS N9, "detached forms are unintuitive") is only answered by **click-to-edit** (Sanity's Presentation tool: the real page beside the editor; click a text or photo on the page to edit it). Dávid agreed to build that **before** hosting, publish rebuild or anything else, as a cheap test of whether Sanity is worth it (`DECISIONS.md` S8). If it does not feel clearly better than forms, stop and reconsider the editor with Dávid.

**Goal:** Dávid runs two commands on his computer, opens the Studio's Presentation view, sees the site, clicks a heading/text/photo, edits it, and the preview updates without publishing. Public builds stay static and never contain drafts.

**Prerequisites (Dávid, check with him first):** the Studio is deployed or runs locally (`npm run studio`), and the content is imported (`npm run sanity:import`). On 2026-11-18 he had run `npm ci`; whether he ran login, deploy and import is unknown, so ask. He also needs a **Viewer token** (sanity.io/manage → project → API → Tokens) in a local `.env` file that is git-ignored; never ask for it in chat or commit it.

**Where to start reading:** `docs/SANITY-PORT-STATUS.md`, `docs/ARCHITECTURE.md` ("Current state", file map, rules), `src/lib/source.ts`, `src/lib/content.ts`, `studio/sanity.config.ts`. Read the current official Sanity guide for visual editing with Astro before writing code; versions in `package.json` are pinned (`@sanity/astro`, `@sanity/visual-editing`, `@sanity/preview-url-secret`, `@astrojs/react` and `@astrojs/cloudflare` are already installed).

**Design points to settle (record them as decisions):**
1. **Preview mode in Astro.** Likely a separate mode (env, e.g. `PREVIEW=1`) where pages are server-rendered on request. This touches `astro.config.mjs`, which CLAUDE.md says to change only when asked: Dávid has asked for this task. Public `npm run build` must stay exactly as it is (check with `npm run check`).
2. **Loading content per request.** Today `src/lib/content.ts` loads all documents **once** with a top-level `await` and keeps them in module-level constants (`byId`, `allPages`, `allPeople`). Preview needs fresh draft content on every request (perspective `drafts`, with a token, and "stega" encoding or Content Source Maps so clicks map to fields). Plan to turn the module constants into a function of the loaded documents (e.g. `loadContent(docs)` returning the same helpers) so static builds call it once and preview calls it per request.
3. **Studio side.** Add `presentationTool` to `studio/sanity.config.ts` with the preview address (`http://localhost:4321` for now) and document locations/resolve so each page document opens its page.
4. **Overlays in the page.** The visual-editing script runs only in preview mode. It is an exception to "no external scripts" for preview only; public pages must not include it (add a check).
5. **Rich text and the Statement text** pass through Markdown (`renderRich`) and plain-text conversion; stega characters must survive or be handled, otherwise clicking text will not find its field. Test this early.

**Done when:** works on Dávid's computer as described; `npm run check` passes and has a check that public output has no draft content and no visual-editing script; `SPEC.md` (new P-requirements), `DECISIONS.md`, `ARCHITECTURE.md`, `SANITY-PORT-STATUS.md`, this backlog and the admin guide's preview part are updated. Then ask Dávid whether click-to-edit is good enough to continue with Sanity.

**Not this task:** Cloudflare hosting, webhooks, launch. A cloud Claude session cannot reach Sanity unless its environment allows `*.sanity.io` hosts; if needed, propose the exact hosts (`8hc671sk.api.sanity.io`, `8hc671sk.apicdn.sanity.io`, `cdn.sanity.io`) or build and test with the `file:` source and let Dávid try the real thing.

## Where things stand (updated 2026-11-18)

| Phase | State |
|---|---|
| Pages CMS proof of concept (`main`) | Done and live at davidpalfi.github.io/forro-bp-website |
| Sanity decisions S1-S4 | Confirmed 2026-11-16 |
| Sanity proof of concept: schemas, site reading Sanity documents, migration, admin guide | **Built and tested offline** (S5-S7). Not yet run against the real Sanity project |
| Studio online, content imported | **Done** 2026-11-18 (Dávid). Photos need one `npm run sanity:import-replace` (S9) |
| Click-to-edit | **Built, local** (S9). Waiting for Dávid to try it and judge it |
| Hosting, rebuild on publish | Not started; after click-to-edit |
| Real content, admin trial, launch | Not started |

## P0: finish the Sanity port

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 1 | Check Sanity Free-plan limits (seats, roles, dataset visibility, Studio hosting, image usage) and record the findings with a date in `DECISIONS.md` | D | Findings recorded; no feature used needs Growth | none |
| 2 | ✅ **Done 2026-11-18** (Dávid). Deploy the Studio. Do not redeploy until the preview is hosted (S9) | D | | |
| 3 | Test the invited-editor sign-in with a test invite | D | A non-developer account can sign in, on a phone too | 2 |
| 4 | ✅ **Done 2026-11-17.** Audit schema coverage: every JSON field mapped (`SPEC.md` 11.2), gaps fixed (S5), checked automatically by `npm run check` [0] | M | | |
| 5 | ✅ **Done 2026-11-17** (offline). Import file + `npm run sanity:import --missing`: fixed ids, repeatable, report, photo upload, order kept, never deletes (S7). Not yet tried against a real dataset | M | | |
| 6 | ✅ **Done 2026-11-18** (Dávid): 20 documents, 6 photos; `CONTENT_SOURCE=sanity npm run build` passes. **Still to do:** `npm run sanity:import-replace` once to fix the photo shape (S9), then compare the look side by side | D | | |
| 7 | ✅ **Done 2026-11-17.** Sanity read layer (`CONTENT_SOURCE`); routes, fallback, safe links, metadata, ordering, warnings kept; parity proven by `npm run check` [5]. Still to do: switch the default to `sanity` after item 6 | M | | |
| 8 | ✅ **Done 2026-11-17.** All ten blocks and Sanity photos with crop and focus point, tested by `npm run check` [6] and in a browser | M | | |
| 9 | Decide hosting: Cloudflare for preview only, or for the public site as well. After item 10 | D | Decision recorded in `DECISIONS.md` | 1, 10 |
| 10 | Click-to-edit preview. **Local part built 2026-11-18** (S9), checked by `npm run check` [7]; Dávid's try pending. Still to do: host it with access protection, `SANITY_STUDIO_PREVIEW_URL`, redeploy the Studio | M | Dávid can click to edit on his computer (pending); the admin can on the host | 9 |
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
| 33 | Upgrade Astro and Sanity packages: `npm ci` reports 37 audit warnings (2026-11-18), all in build and editor tooling (file matching, YAML, dev server), none in the published static pages. Do not run `npm audit fix --force`; upgrade the pinned versions deliberately and run `npm run check` | M | Not urgent; do before launch |

## Open decisions to collect

- Hosting for preview and production (9)
- Rebuild provider and webhook (11)
- Launch practicalities (20)
- What `/` shows (22)
- Care-team contact details (18)
- Community level content (26)
