# Sanity Port Status

Status as of 2026-11-18. The progress record for the Sanity version. Update it as work is completed; do not treat plans as implementation.

## Where it stands

| Part | State |
|---|---|
| Decisions S1-S4 (languages side by side, page builder, hosted Studio, Sanity photos) | Confirmed by Dávid 2026-11-16 |
| Studio and schemas (`studio/`) | Built, refined in S5, validated, builds. **Not deployed** |
| Site reads Sanity documents (`src/lib/source.ts`, `content.ts`, `Blocks.astro`) | Built and tested. Default source is still the JSON files |
| Migration (`npm run sanity:import-file`, `npm run sanity:import`) | Built and tested offline. **Not run** against the real project |
| Admin guide (`docs/EDITING-GUIDE.md`) | Written from the configured Studio; to be checked against the deployed one |
| Click-to-edit preview (SSR) | **Next task** (S8). Brief: `BACKLOG.md`, "Next task for the next agent" |
| Rebuild on publish, hosting | Not started; host not chosen |
| Admin trial and sign-off | Not started |

What was verified on 2026-11-17, all without access to Sanity (the session's network blocked it):

- `npm run check`: all sections pass, including the new ones: the content fits the Studio schema [0]; the import file is complete, dot-free and repeatable, and a site built from it is byte-identical to the JSON-built site [5]; Sanity-shaped content with uploaded photos, every block and editor mistakes renders correctly and warns [6].
- `npm run studio:build` and `npx sanity schema validate` (0 errors, 0 warnings).
- Browser, 390 and 1280 px: the JSON-built site side by side with the previous build looks the same; a page with every block type has no horizontal scrolling and no console errors.

Not verified: anything that needs the real Sanity project: deployment, sign-in, the import itself, reading from the API (`CONTENT_SOURCE=sanity`), the image service URLs loading, the editor's look and wording.

## Next steps, in order

On 2026-11-18 the branch was pushed and Dávid ran `npm ci` (it reported 37 npm audit warnings in build tooling: harmless for the static site, backlog item 33). Whether he ran login, deploy and import is not confirmed: ask him.

1. **Dávid, on his computer (about 15 minutes):**
   ```
   git fetch && git checkout claude/site-progress-backlog-k1rq9i   # or feature/sanity once merged
   npm ci
   npm run sanity:login          # opens the browser; sign in to Sanity
   npm run studio:deploy         # puts the editor online at forro-budapest.sanity.studio
   npm run sanity:import         # creates the content in Sanity (only missing documents)
   CONTENT_SOURCE=sanity npm run dev    # the site, now read from Sanity, at localhost:4321
   ```
   If `studio:deploy` says the name is taken, change `studioHost` in `studio/sanity.cli.ts`. If the build with `CONTENT_SOURCE=sanity` reports 401/403, the dataset is private: either make it public in sanity.io/manage (content is public on the site anyway) or create a read token and set `SANITY_READ_TOKEN`.
   Before that, read Sanity's current Free plan once (seats, roles, dataset visibility) and note it in `DECISIONS.md`.
2. **Click-to-edit on Dávid's computer** (S8): the full brief is at the top of `BACKLOG.md`. Dávid's first impression of the plain editor was "this is just forms again", so this decides whether Sanity stays.
3. **Check the editor against the guide.** Open the hosted Studio, walk through `docs/EDITING-GUIDE.md`, fix wording or steps that differ, and edit one thing to see it in `CONTENT_SOURCE=sanity npm run dev`.
4. **Choose hosting and build the rebuild on publish** (backlog items 9 and 11). Cloudflare Pages (free) can build on a Sanity webhook (a deploy hook URL) and host the preview later. Secrets go only into the provider's settings.
5. **Move the preview to the chosen host.**
6. **Admin trial** with the guide (backlog item 13), then real content and launch per `GO-LIVE-CHECKLIST.md`.

## Rules for whoever continues

- Work on `feature/sanity` (or a branch from it); keep `main`, its live site and `.pages.yml` unchanged until launch.
- Never request or commit tokens. Project id and dataset name are configuration, not secrets.
- Keep `npm run check` passing; when the model changes, update `from-json.ts`, the schema, `SPEC.md` 11 and the admin guide together.
- Keep this file current.
