# Working in this repository

This is a static Astro website. The people who edit it are usually not developers, so keep changes small, safe and easy to review.

## Before changing structure

For content edits you can skip this. For anything structural (new fields, new page types, tooling, hosting), read `docs/HANDOFF.md`, then `docs/SPEC.md` and `docs/ARCHITECTURE.md` (the recipes there list every place a change must touch), and `docs/DECISIONS.md`. Record any new or changed decision in `docs/DECISIONS.md` and any changed behaviour in `docs/SPEC.md` in the same change. `DECISIONS.md` also lists assumptions about Pages CMS that are still unverified.

## Where things are

- Content is in `src/content/` as plain files: `events/`, `people/`, `links/`, `pages/` (Markdown), and `settings/` (`site.json`, `home.json`).
- Photos are in `public/uploads/`. Never edit or delete `public/_img/`; it is generated at build time.
- The editing forms are described in `.pages.yml`. The content shape is in `src/content.config.ts`. They must stay in step: a new field is added in both places, plus the page that shows it.
- Page code is in `src/pages/`, `src/components/`, `src/layouts/`; styles are in `src/styles/global.css`.

## Rules for content changes

- Change only the content files that the request needs. Do not touch code, styles or config unless asked.
- Dates are `yyyy-MM-dd` (for example `2027-06-19`). Times are 24-hour (`20:00`).
- An event's `people` list holds paths of files in `src/content/people/`, for example `src/content/people/teacher-anna.json`. The person's file must exist.
- New event file names follow `yyyy-MM-dd-title-in-lowercase.json`; new people and links use a lowercase hyphenated name.
- Links must start with `https://`. Photo fields hold a path like `/uploads/name.jpg`, and the photo must exist in `public/uploads/`.
- Never invent details (dates, times, names, links, bios). If something is missing, leave the field empty and say so.
- Keep JSON valid: double quotes, commas between fields, no comma after the last one.

## Before finishing

1. Run `npm run build`. It must pass. Read any `[content-warning]` lines in the build output; they mean something was skipped.
2. Tell the user in plain language what changed and what to check on the live site (dates, times, names).
3. Make changes on a branch and open a preview if the host supports it; do not push straight to the live branch unless the user says so.

## Do not

- Add external scripts, fonts or trackers.
- Add dependencies without being asked (and keep versions exact).
- Change `astro.config.mjs`, `.github/workflows/` or the build setup.
- Write root-relative addresses like `/program/` by hand in code: use `withBase()` (see `docs/ARCHITECTURE.md`, rule 6). In Markdown text pages `/program/` is fine; it is rewritten at build time.
