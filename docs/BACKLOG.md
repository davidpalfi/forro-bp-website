# Project backlog

Built on 2026-11-17 (last updated 2026-11-18, evening) from `HANDOFF.md`, `SANITY-PORT-STATUS.md`, `GO-LIVE-CHECKLIST.md`, `DECISIONS.md`, `SPEC.md` and `USER-NEEDS.md`. It only lists work those documents describe. When an item is done, tick it here and update the status file it came from.

Priority:
- **P0**: blocks the Sanity port; do in this order.
- **P1**: needed before the new site replaces Wix.
- **P2**: after launch, or when someone asks for it.

Owner: **D** = Dávid (accounts, decisions), **M** = maintainer/agent (code), **A** = admin.

## ▶ Next task for the next agent: go live for the admin's review

**Status 2026-11-18, late evening: code done (S11).** Dávid chose the preview lock and polish A first; both built. Preview on Cloudflare, lock, test site and rebuild on Publish are ready and tested locally (`npm run check` [8]). **Waiting for Dávid** to create the two Workers and the Sanity webhook (`HOSTING.md`). Then: preview address into `studio/.env.production`, test address into `docs/EDITING-GUIDE.md` (replace ‹test site address›, remove the maintainer note), Dávid runs `npm run studio:deploy` and tries it in the deployed Studio (Safari: the cookie in the frame is the part least certain), invite test, send. The items below are kept for the record.

**Why (2026-11-18, late evening).** Dávid tried click-to-edit and approved it (S8 outcome: Sanity stays). Next he wants **the current version online so he can send it to the admin for review** and collect her input, before further polish. The full checklist (who does what) is in the root [README.md](../README.md), "Next step: go live for the admin's review". In short:

- **Dávid first: done except decisions** (2026-11-18, late evening): Free plan with both as Administrators (`DECISIONS.md` S10); Cloudflare account created (GitHub sign-in, nothing connected yet); invite test moved to just before sending. **Still ask him:** the preview lock (recommended), whether polish item A comes first (recommended; explained to him, undecided), the domain (launch only).
- **Agent:**
  1. **Preview on Cloudflare** (the main work). Cloudflare Workers cannot read project files: in preview, `src/lib/content.ts` must not touch `node:fs` (the `public/_img` manifest, `localImage`) and the start-up load must not read the JSON files (`from-json.ts`). Everything in preview comes from Sanity. Use `@astrojs/cloudflare` (installed, 14.4.8) only in preview mode; the public build stays static and must stay byte-identical (`npm run check` [7]). Read the installed adapter's README and the current Cloudflare free-plan terms first.
  2. **Preview lock**: `@sanity/preview-url-secret` (installed): Presentation's `previewMode.enable` route validates the secret and sets a cookie; without it the preview shows nothing unpublished. The Viewer token only in Cloudflare's secret settings. Record the result in `DECISIONS.md` S9 "Access".
  3. **Test site**: static build with `CONTENT_SOURCE=sanity` on Cloudflare, `SITE_URL` set, noindex on; a Sanity webhook to a deploy hook so Publish rebuilds it (backlog item 11). A failed build keeps the previous site.
  4. **Studio**: `SANITY_STUDIO_PREVIEW_URL` to the online preview, then `npm run studio:deploy` (not before). Consider "Edit on the page" as the first tool.
  5. **Admin guide** (`docs/EDITING-GUIDE.md`) with the real addresses; remove the "not ready" notes and the local-only note on section 4a.
  6. **Run through it** on desktop and phone; `npm run check` passes; update `SPEC.md` (P14, P15), `DECISIONS.md`, `ARCHITECTURE.md`, `SANITY-PORT-STATUS.md`, this backlog and the README checklist.
- **Then Dávid** invites her (sanity.io/manage > Members) and sends the guide and the two addresses.

**Not this task:** the domain, Wix, launch; polish B-G (after her review).

---

## Click-to-edit polish (after the admin's review; item A may come first)

**Why (2026-11-18, evening).** Dávid tried click-to-edit on his computer (`npm run preview:edit` + local Studio, "Edit on the page") and found it works "pretty awesome"; he also created a community page in the Studio without help. Verdict on S8: **continue with Sanity**. He wants it as polished as Sanity allows. Item A (no reload) may be done before the review if Dávid wants; the rest after her feedback.

**State to start from:** `DECISIONS.md` S9 (how the preview is built), `SPEC.md` 11.7 (P18-P22), `ARCHITECTURE.md` "Click-to-edit preview". Code: `src/lib/preview-client.ts` (browser script), `src/middleware.ts`, `src/lib/source.ts` (`loadPreviewDocuments`, marker filter), `src/lib/content.ts` (`useDocuments`, `editAttr`), `studio/sanity.config.ts` (`presentationTool`). Pinned: `@sanity/visual-editing` 6.2.1, `@sanity/client` 8.16.0, `sanity` 6.23.0; read the README of the installed version in `node_modules` before using an API. Our site is plain Astro (no React in the page), so features documented only for React must be tried before they are promised.

**How to test:** Dávid's `.env` holds `SANITY_VIEWER_TOKEN` (never read it out or ask for it). Without it, `npm run preview:edit` shows published content with markers (drafts need the Studio to open the preview: the lock). `npm run check` [8] tests the preview with a stand-in for Sanity. Clicking inside the Studio needs a signed-in browser, so Dávid does the final try. Astro 7 runs one dev server per project unless `--ignore-lock`; the preview uses port 4322 for that reason; stop stray ones with `lsof -ti:4322 | xargs kill`.

### Polish, in this order

| # | What | Now | After | Effort | Notes |
|---|---|---|---|---|---|
| A ✅ done 2026-11-18 (S11) | **No reload after an edit** (biggest gain) | Each save reloads the whole page: white flash, back to the top | The script fetches the page's new HTML in the background and swaps only what changed; no flash, scroll position kept | ~1-2 h | In `refresh` of `preview-client.ts`. Not letter by letter: Sanity saves after a short pause, so about a second after typing stops. Letter-by-letter would need the site rebuilt as a JavaScript app; not worth it. After a swap the overlays must find the new elements (check). |
| B | **Click a whole block** | Only texts and photos have outlines; background, alignment, deleting a block need the form | Every block (text, gallery, button, people grid, ...) has an outline; clicking its edge opens the whole block with its Style tab | small | `data-sanity` on each block element in `Blocks.astro` with path `blocks:<key>` (or `homeBlocks:<key>`), preview only, like `editAttr`. Blocks need to know their document id and field. |
| C | **Right-click menu on blocks: insert before/after, duplicate, move up/down, remove** | none | Wix-like menu on the page | small if supported | **Test first**: offered by `@sanity/visual-editing`, documented mainly for React. Needs B. Drop it if it does not work and say so. |
| D | **Drag to reorder** blocks, gallery photos, people in a people grid | none | Drag on the page | small-medium | **Test first**, as C. Without React the page refreshes after the drop instead of moving smoothly; acceptable if A is done. |
| E | **Everything visible is clickable** | Footer e-mail and social links, button links, band colours do nothing | They open their field (e-mail and links in Site settings, a button's link, ...) | small | URLs and e-mail must stay free of markers (they are compared and used as addresses): use `data-sanity` attributes, not stega. Fixed wording from `src/lib/i18n.ts` ("Tickets", "Home", menu button) cannot be edited in Sanity: show a hint such as "fixed text, ask Dávid" instead of nothing. |
| F | **"Published / Drafts" switch works** | The Studio's switch above the page is ignored; the preview always shows drafts | "Published" shows exactly what visitors see | small | Read the perspective the Presentation tool passes (query parameter or comlink, check the installed version) in `src/middleware.ts`; keep drafts as the default. |
| G | **People and settings show where they appear** | Pages and the two home pages list their addresses; a person or Site settings lists none | A teacher shows "Teachers page", Site settings "every page"; clicking opens it | small | `resolve.locations` in `studio/sanity.config.ts`. People appear through People blocks (by group or chosen), so a static mapping is wrong for chosen people; check whether the installed version lets `locations` query. |

Already built into the Studio, nothing to do: the phone-size switch above the page.

**Recommendation agreed with Dávid:** do A, B, E, F, G for sure (about half a day together); try C and D and keep them only if they work smoothly.

**Done when:** each item works on Dávid's computer; `npm run check` passes and [7] still proves public builds carry none of it (extend it for any new attribute); `SPEC.md` 11.7, `DECISIONS.md` S9 (or a new S10), `ARCHITECTURE.md` and the admin guide section 4a describe the result; this table is ticked.

### Also raised by Dávid (2026-11-18)

- **Community menu: Events, Contact, About Us** next to the Festival link. Contact and About Us are ordinary community pages, made in the Studio without code (Content > Community pages > +; Dávid made one). **Events** is either a hand-written page (no code) or a real events list (one entry per event with date, place, link; sorted by date; past events hidden), which needs a new document type and block: ask the admin what an event holds and how often they change first (item 26).
- What `/` shows once the community level has content (item 22): probably the community home.

---

## Where things stand (updated 2026-11-18)

| Phase | State |
|---|---|
| Pages CMS proof of concept (`main`) | Done and live at davidpalfi.github.io/forro-bp-website |
| Sanity decisions S1-S4 | Confirmed 2026-11-16 |
| Sanity proof of concept: schemas, site reading Sanity documents, migration, admin guide | **Built and tested offline** (S5-S7). Not yet run against the real Sanity project |
| Studio online, content imported | **Done** 2026-11-18 (Dávid), photos repaired with `npm run sanity:import-replace` the same day |
| Click-to-edit | **Built, local, approved by Dávid** 2026-11-18 ("pretty awesome"; continue with Sanity). Polish A-G planned, mostly after the admin's review |
| Online for the admin's review (hosting, preview lock, rebuild on publish) | **Code done** 2026-11-18 (S11); waiting for Dávid's Cloudflare setup (`HOSTING.md`) |
| Real content, admin trial, launch | Not started |

## P0: finish the Sanity port

| # | Item | Owner | Done when | Depends on |
|---|---|---|---|---|
| 1 | Check Sanity Free-plan limits (seats, roles, dataset visibility, Studio hosting, image usage) and record the findings with a date in `DECISIONS.md` | D | Findings recorded; no feature used needs Growth | none |
| 2 | ✅ **Done 2026-11-18** (Dávid). Deploy the Studio. Do not redeploy until the preview is hosted (S9) | D | | |
| 3 | Test the invited-editor sign-in with a test invite | D | A non-developer account can sign in, on a phone too | 2 |
| 4 | ✅ **Done 2026-11-17.** Audit schema coverage: every JSON field mapped (`SPEC.md` 11.2), gaps fixed (S5), checked automatically by `npm run check` [0] | M | | |
| 5 | ✅ **Done 2026-11-17** (offline). Import file + `npm run sanity:import --missing`: fixed ids, repeatable, report, photo upload, order kept, never deletes (S7). Not yet tried against a real dataset | M | | |
| 6 | ✅ **Done 2026-11-18** (Dávid): 20 documents, 6 photos; photos repaired with `npm run sanity:import-replace`; `CONTENT_SOURCE=sanity npm run build` passes. Still to do: compare the look side by side with the JSON build | D | | |
| 7 | ✅ **Done 2026-11-17.** Sanity read layer (`CONTENT_SOURCE`); routes, fallback, safe links, metadata, ordering, warnings kept; parity proven by `npm run check` [5]. Still to do: switch the default to `sanity` after item 6 | M | | |
| 8 | ✅ **Done 2026-11-17.** All ten blocks and Sanity photos with crop and focus point, tested by `npm run check` [6] and in a browser | M | | |
| 9 | Decide hosting: Cloudflare for preview only, or for the public site as well. After item 10 | D | Decision recorded in `DECISIONS.md` | 1, 10 |
| 10 | Click-to-edit preview. **Local part built and approved 2026-11-18** (S9). **Next (top):** host it with the preview lock, `SANITY_STUDIO_PREVIEW_URL`, redeploy the Studio. Polish A-G after the review | M | The admin can click to edit on the host | 9 |
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
| 26 | Community level: ask the admin what it should show (classes, parties, people, links) and how often it changes, then design it | D + A, then M | Dávid wants Events, Contact and About Us in the community menu (2026-11-18). Contact and About Us: community pages, no code. Events: a page now, or an events document type + block once the admin says what an event holds |
| 27 | New block types from the admin's drawings | M | Do not guess blocks before her drawings arrive (S2) |
| 28 | Program as text as well as images, for screen readers and search | A / M | Optional text field exists in the PoC |
| 29 | Alt text on people photos | M | The Sanity person photo already has EN/HU alt fields; the rendering in item 8 should use them |
| 30 | Accessibility review and testing in browsers other than Chromium | M | Never done |
| 31 | Sitemap | M | Not specified yet |
| 32 | Decide whether to keep or retire the Pages CMS PoC and `.pages.yml` once Sanity is live | D | Keep it as the fallback until Sanity is stable |
| 33 | Upgrade Astro and Sanity packages: `npm ci` reports 37 audit warnings (2026-11-18), all in build and editor tooling (file matching, YAML, dev server), none in the published static pages. Do not run `npm audit fix --force`; upgrade the pinned versions deliberately and run `npm run check` | M | Not urgent; do before launch |

## Open decisions to collect

- **The real domain: forrobudapest.com or forrobudapest.hu (or both)?** The docs assume .com (where the Wix site was read on 2026-11-11); Dávid wrote .hu on 2026-11-18. Ask before any launch or redirect work (20, 21, 24). Until launch the test addresses are free Cloudflare ones (`*.pages.dev` or `*.workers.dev`) and `forro-budapest.sanity.studio`.
- Hosting for preview and production (9)
- Rebuild provider and webhook (11)
- Launch practicalities (20)
- What `/` shows (22)
- Care-team contact details (18)
- Community level content (26)
