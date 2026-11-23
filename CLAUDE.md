# Working in this repository

A static Astro website for the Forró Budapest community, with the festival as a section below it, in English and Hungarian. The person who edits content is not a developer and uses Sanity Studio (forms and click-to-edit); Claude works here for the maintainer. `main` is the Sanity version (since 2026-11-23); the old Pages CMS proof of concept is kept as the tag `pages-cms-poc`. Keep changes small, safe and easy to review.

## Before changing structure

For content edits you can skip this. For anything structural (new fields, new page types, design, tooling, hosting), read `docs/HANDOFF.md`, then `docs/DECISIONS.md`, `docs/SPEC.md` and `docs/ARCHITECTURE.md` (its recipes list every place a change must touch). Record any new or changed decision in `docs/DECISIONS.md` and any changed behaviour in `docs/SPEC.md` in the same change.

## Where things are

- The live content is in Sanity (project `8hc671sk`, dataset `production`), edited in the Studio. The JSON files in `src/content/` (`settings/`, `people/`, `pages/`) are the original content: the source of the Sanity import and of the tests (`CONTENT_SOURCE` defaults to them). Editing them does not change the test site, which is built from Sanity.
- Photos are in `public/uploads/`. Never edit or delete `public/_img/`; it is generated at build time.
- The editor is `studio/` (Sanity Studio). The site renders Sanity documents; `src/lib/from-json.ts` converts the JSON files into the same documents, and `npm run check` fails if they stop matching the Studio schema. Hosting is on Cloudflare (`docs/HOSTING.md`). See `docs/SANITY-PORT-STATUS.md`.
- Fixed wording in both languages is in `src/lib/i18n.ts`.
- Page code is in `src/pages/[lang]/`, `src/components/`, `src/layouts/`; styles are in `src/styles/global.css`.

## Rules for content changes

These apply to the JSON files (the import source and test content). Content on the site is changed in Sanity Studio, by the admin.


- Change only the content files the request needs. Do not touch code, styles or config unless asked.
- Texts that differ by language come in pairs: `bio_en` and `bio_hu`. When you change one, say whether the other was changed too. Do not translate on your own unless asked; an empty field falls back to the other language.
- A person's `group` is `Teacher` or `Artist`.
- New people and text pages use a lowercase hyphenated file name without accents (`dori-czako.json`). A text page's file name is its address; do not rename existing ones.
- Links must start with `https://`. Photo fields hold a path like `/uploads/name.jpg`, and the photo must exist in `public/uploads/`.
- Never invent details (dates, names, links, bios). If something is missing, leave the field empty and say so.
- Do not add personal contact details (phone numbers, private emails) unless the maintainer asks; the repository may be public.
- Keep JSON valid: double quotes, commas between fields, no comma after the last one.

## Rules for code changes

- Read two-language fields with `tr()`; never `x_en` or `x_hu` directly in a page.
- Never write an address by hand: use `href(lang, '/festival/...')` or `withBase()`. Links go through `safeUrl`, photos through `getImage` or `Picture`.
- Every page under `src/pages/[lang]/` returns all languages from `getStaticPaths` and passes `lang`, `section` and `pagePath` to `Base`.
- Problems in content must become `[content-warning]` lines, never build failures, and warnings must never block publishing.
- No external scripts, fonts or trackers. New dependencies only when asked, pinned to an exact version.
- Do not change `astro.config.mjs`, `wrangler.jsonc`, `wrangler.site.jsonc`, `.github/workflows/` or the build setup unless asked.

## Before finishing

1. Content change: run `npm run build`; it must pass. Read any `[content-warning]` lines. Code change: run `npm run check`; it must pass.
2. For visible changes, look at the result in a browser at phone and desktop width (`docs/HANDOFF.md`, "How to check things").
3. Tell the user in plain language what changed and what to look at on the live site.
4. Code changes are pushed straight to `main` once `npm run check` passes (Dávid, 2026-11-23: revert if something breaks). Commit only when asked. Every push to `main` rebuilds both Cloudflare sites.
