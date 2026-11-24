# Sanity Port Status

Status as of 2026-11-24. The progress record for the Sanity version. Update it as work is completed; do not treat plans as implementation.

## Where it stands

| Part | State |
|---|---|
| Decisions S1-S4 (languages side by side, page builder, hosted Studio, Sanity photos) | Confirmed by Dávid 2026-11-16 |
| Studio and schemas (`studio/`) | Built, refined in S5, validated. **Deploys itself** from GitHub since 2026-11-24 when Studio code changes on `main` (S19, `.github/workflows/studio-deploy.yml`; first run succeeded), with "Edit on the page" pointing at the online preview. Many fields added 2026-11-23/24 (logos, calendar, colours, community headline): see `BACKLOG.md`, "Look polish done" |
| Site reads Sanity documents (`src/lib/source.ts`, `content.ts`, `Blocks.astro`) | Built and tested. Default source is still the JSON files |
| Migration (`npm run sanity:import-file`, `npm run sanity:import`) | **Run** by Dávid 2026-11-18: 20 documents, 6 photos. Photos were stored the wrong way; import file fixed and photos repaired with `npm run sanity:import-replace` the same day |
| Admin guide (`docs/EDITING-GUIDE.md`) | Written; real addresses in since 2026-11-23. Send a copy without the maintainer note; check once more against the deployed Studio |
| Click-to-edit preview | **Built, approved by Dávid** 2026-11-18 (S8 outcome, S9). **Online** since 2026-11-23 with the preview lock and no reload after an edit (S11, `SPEC.md` P14, P20); verified by Dávid in Safari. Polish B-H after the admin's review |
| Rebuild on publish, hosting | **Online and tested** 2026-11-23 (S11): test site on Cloudflare, rebuilt by a Sanity webhook through a deploy hook (`HOSTING.md`) |
| Admin trial and sign-off | Not started; sending to her on hold until Dávid is ready (`BACKLOG.md` 13a) |

What was verified on 2026-11-17, all without access to Sanity (the session's network blocked it):

- `npm run check`: all sections pass, including the new ones: the content fits the Studio schema [0]; the import file is complete, dot-free and repeatable, and a site built from it is byte-identical to the JSON-built site [5]; Sanity-shaped content with uploaded photos, every block and editor mistakes renders correctly and warns [6].
- `npm run studio:build` and `npx sanity schema validate` (0 errors, 0 warnings).
- Browser, 390 and 1280 px: the JSON-built site side by side with the previous build looks the same; a page with every block type has no horizontal scrolling and no console errors.

Verified on 2026-11-18 on Dávid's computer, with network access to Sanity:

- Signed in; the content is in `production` (26 documents including the 6 photos); the dataset is readable without a token; the Studio address forwards to the deployed Studio.
- `CONTENT_SOURCE=sanity npm run build` passes and takes photos from `cdn.sanity.io`, with one warning: the photos' stored shape (fixed by the re-import).
- The click-to-edit preview with published content: every page renders; texts carry markers, also through rich text; every photo has a click target; Sanity's editing script outlines all of them. The public build is byte-for-byte the same as before.

Then Dávid, the same evening: set up his Viewer token in `.env`, repaired the photos, and in Safari clicked texts and photos in "Edit on the page", edited drafts and saw them in the page; created and published a community page from Content > Community pages.

Not verified: invited-editor sign-in, the editor's look and wording against the guide, other browsers than Safari for the Studio.

Built and verified on 2026-11-18 (late evening, cloud session, no access to Sanity or Cloudflare): the preview built for Cloudflare and run in Cloudflare's local runtime against a stand-in for Sanity (`npm run check` [8]: lock, drafts, parallel requests, every page, 404s, update without reload in Chromium); the test site's Worker config serves the static build with 404 page and trailing-slash redirects; the public build is byte-for-byte unchanged; `npm run studio:build` passes. Not verified: the real Studio handshake and the cookie inside the Studio's frame (Safari especially), Workers Builds, the deploy hook, the Sanity webhook on Free.

## Next steps, in order

0. **Look polish** (in progress, top of `BACKLOG.md`): Dávid sends what bothers him; the agent fixes it on `main`. Then his content steps in the Studio ("Open for Dávid in the Studio" there).
1. **Send it to the admin when Dávid is ready** (`BACKLOG.md` 13a): his phone check of the forms, invite test, a clean copy of the guide, invite her, send.
2. **Her trial** (`BACKLOG.md` 13), then polish B-H, her design corrections, real content.
3. ✅ `main` is the Sanity version (2026-11-23, S12).
4. **Launch** per `GO-LIVE-CHECKLIST.md`: hosting of the real site, domain, redirects, noindex off.

The Studio deploys itself from GitHub. By hand: GitHub > Actions > Deploy Studio > Run workflow, or `npm run studio:deploy` on a computer whose `studio/.env.production` has the preview address (it refuses otherwise).

## Rules for whoever continues

- Push straight to `main` (Dávid, 2026-11-23: "push to main and we revert if something breaks"), after `npm run check` passes. Every push rebuilds both Cloudflare sites; undo a bad change with `git revert`. The old proof of concept is the tag `pages-cms-poc`.
- Never request or commit tokens. Project id and dataset name are configuration, not secrets.
- Keep `npm run check` passing; when the model changes, update `from-json.ts`, the schema, `SPEC.md` 11 and the admin guide together.
- Keep this file current.
