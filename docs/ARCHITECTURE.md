# Architecture

How the code is organised and how to change it safely. For what the site does, see `SPEC.md`; for why it is built this way, see `DECISIONS.md`.

## Data flow

```
Editor (Pages CMS forms)
   |  saves = a commit
   v
GitHub repository:  src/content/**  and  public/uploads/**
   |  push triggers a build on the host
   v
npm run build
   1. scripts/optimize-images.mjs   public/uploads/*  ->  public/_img/*.webp + manifest.json
   2. astro build
        src/content.config.ts   loads and validates the content files (forgiving)
        src/lib/content.ts      normalises: defaults, sorting, links, dates, images
        src/pages, layouts, components   render HTML
   v
dist/   plain static files, served by the host
```

There is no runtime code on the server. The only browser JavaScript is one small inline script in `src/layouts/Base.astro` that hides past program items.

## File map

| Path | Responsibility |
|---|---|
| `src/content/settings/site.json`, `home.json` | Site-wide settings and home page texts (read directly by `lib/content.ts`) |
| `src/content/events`, `people`, `links` | One JSON file per item (collections) |
| `src/content/pages/*.md` | Free-form text pages (collection, Markdown) |
| `public/uploads/` | Uploaded photos (committed). `public/_img/` is generated and ignored by Git |
| `.pages.yml` | The editing forms (Pages CMS). Must mirror the content model |
| `src/content.config.ts` | Declares the four collections and their (forgiving) shape |
| `src/lib/schema.ts` | Forgiving field types: `text`, `flag`, `num`, `textList` |
| `src/lib/content.ts` | The only place pages get content from: settings, events, people, links, pages, dates, safe links, images |
| `src/layouts/Base.astro` | Head, menu, footer, the past-event script |
| `src/pages/index.astro`, `program.astro`, `people.astro`, `[slug].astro`, `404.astro` | The routes |
| `src/components/EventRow.astro`, `PersonCard.astro`, `Picture.astro` | Reusable pieces |
| `src/styles/global.css` | All styling; colours and fonts as variables at the top |
| `scripts/optimize-images.mjs` | Photo resizing before each build |
| `scripts/check.mjs` | `npm run check`: reproducible tests |
| `astro.config.mjs` | Reads `SITE_URL` and `SITE_BASE` from the environment (defaults `https://example.com` and `/`); trailing slash setting |
| `.github/workflows/deploy.yml` | GitHub Pages: check job, build job (works out URL/base, builds, uploads), deploy job |
| `scripts/ci-build.mjs` | Runs the build in CI and copies `[content-warning]` lines to the run summary |
| `.node-version`, `package.json`, `package-lock.json` | Pinned Node (22.23.4), scripts, two exactly pinned dependencies (`astro`, `sharp`) |
| `.gitattributes`, `.editorconfig`, `public/.nojekyll` | Line endings, editor settings, tells GitHub Pages not to post-process files |
| `README.md`, `EDITING-GUIDE.md`, `CLAUDE.md`, `docs/*` | Documentation (see "Documentation" in `README.md`) |

## Rules the code follows

1. **Pages never read raw files.** They call helpers in `src/lib/content.ts`, which tolerate missing fields and skip broken entries with a `[content-warning]` line.
2. **Every field is optional in the code.** "Required" lives only in `.pages.yml`.
3. **Links go through `safeUrl`** before being rendered. **Photos go through `getImage`**, which returns web-sized copies, the original, or nothing.
4. **Dates are calendar days** parsed at noon UTC and formatted in UTC, so no time zone can shift a day.
5. **No third-party requests** from the pages (no fonts, scripts, trackers).
6. **Never write a root-relative address (`/program/`, `/uploads/x.jpg`) by hand in pages or components.** Use `withBase()` for internal addresses; `safeUrl()` and `getImage()` already apply it. Markdown text pages are fixed by `rebaseHtml()` in `[slug].astro` (Astro 7's default Markdown processor has no simple plugin hook, so the rendered HTML is rewritten instead). `npm run check` section 4 fails if a link ignores the base.

## Astro 7 specifics (this repo uses Astro 7.4)

These differ from older tutorials:

- `defineCollection` comes from `astro/content/config`, the `glob` loader from `astro/loaders`, and `z` from `astro/zod`. The collections file is `src/content.config.ts`.
- Rendering Markdown: `import { render } from 'astro:content'` and `await render(entry)`.
- Entry ids are generated from file names with `generateId` (see `content.config.ts`), so a stored reference like `src/content/people/teacher-anna.json` matches the id `teacher-anna`.
- The `create-astro` templates cannot be downloaded in restricted environments; the project was created by hand (`npm install astro sharp`).
- Astro 7 needs Node 22.23.4 or newer.

## Gotchas

- `getStaticPaths` in `[slug].astro` is hoisted by Astro; it cannot use variables declared outside it. Imports are fine.
- `lib/content.ts` finds `public/_img/manifest.json` through `process.cwd()`, so builds must run from the project root (npm scripts do).
- In `.pages.yml` reference labels, `{name}` means the entry's file name, not the `name` field. Use `{primary}` to show the primary field.
- Hidden elements need the `[hidden] { display: none !important }` rule in `global.css`; component styles that set `display` would otherwise override the `hidden` attribute.
- Renaming a person's file silently unlinks them from program items (references are file paths).
- `public/_img` is regenerated on every build; never commit it or edit it.
- Pages CMS's stored value formats were assumed from its docs, not observed. See the assumptions table in `DECISIONS.md`.

## How to change things

### Add a field to something that exists (for example a "video link" on people)

1. `src/content.config.ts`: add the field with the matching helper from `lib/schema.ts` (`text`, `flag`, `num`, `textList`).
2. `.pages.yml`: add the form field to the same collection.
3. The page or component that shows it (use `safeUrl` for links).
4. Add a sample value to one or two placeholder files, and a line in `SPEC.md` section 5.
5. `npm run check`.

### Add a new kind of content (a new collection)

1. Create the folder under `src/content/` and a sample file.
2. `content.config.ts`: new `defineCollection` with the `glob` loader and `generateId: idFromFile`; add it to `collections`.
3. `lib/content.ts`: a `getX()` helper that normalises and sorts; use `console.warn('[content-warning] ...')` for anything skipped.
4. A page or section that uses it.
5. `.pages.yml`: a new `content` entry (collection, `format: json`, `view.primary`).
6. `scripts/check.mjs`: add an assertion; `SPEC.md`: document it; `DECISIONS.md` if it is a real decision.

### Add a page (route)

Add a file in `src/pages/`, wrap it in `Base`, and read content only through `lib/content.ts`. Add its address to the reserved list in `lib/content.ts` (`RESERVED_SLUGS`) so a text page cannot clash with it, and to the menu in `Base.astro` if it should appear there.

### Add a text page without code

Add a Markdown file in `src/content/pages/` (or use the editor). It gets the address `/<file-name>/` and appears in the menu when `showInMenu` is true.

### Add a second language (not designed yet)

Two realistic shapes, to decide with the admin:
- **Separate content per language** (`src/content/en/...`, pages under `/en/`): simple for editors to understand, doubles what they maintain, and needs a language switcher.
- **Translated fields in the same files** (`title_en`, `bio_en`): fewer files, but forms become long.
Either way the labels in `site.json` need a per-language set. Record the choice in `DECISIONS.md`.

### Replace the design with the admin's

Keep `lib/`, `content.config.ts`, `.pages.yml`, the content and the scripts. Replace `src/styles/global.css` and the markup in `src/pages`, `src/components` and `src/layouts`. Keep calling the same helpers. Keep the safe-link, photo and past-event behaviours (SPEC R9, R18, R19). Run `npm run check` and the manual checks in `HANDOFF.md`.

### Swap the editing tool

The content files do not change. Replace `.pages.yml` with the new tool's configuration, keep `content.config.ts` as the source of truth for the content shape, and re-check the stored value formats (photo paths, references, dates).

### Swap the host

Any static host: build command `npm run build`, output folder `dist`, Node 22.23.4 or newer. Set `SITE_URL` (and `SITE_BASE` if served under a sub-path) in the host's environment. On a custom domain `SITE_BASE` stays `/`.

### Upgrade Astro or Node

Change the exact versions in `package.json` and `.node-version` (also `node-version` in `.github/workflows/deploy.yml`), run `npm install`, then `npm run check` and the manual browser checks. Re-read the "Astro 7 specifics" above if imports break.
