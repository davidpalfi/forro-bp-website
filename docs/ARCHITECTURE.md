# Architecture

How the code is organised and how to change it safely. For what the site does, see `SPEC.md`; for why it is built this way, see `DECISIONS.md`.

## Current state (2026-11-23, `main`)

The site renders **Sanity documents**. They come from Sanity, or from the JSON files in `src/content` converted to the same documents; `CONTENT_SOURCE` chooses (`SPEC.md` 11.1). The default is still the JSON files, so the site builds and is tested without Sanity access. The content is imported and the Studio deployed (2026-11-18). Click-to-edit runs as a preview on Cloudflare (and locally); the test site is built from Sanity on Cloudflare and rebuilt on Publish (below, `SPEC.md` 11.7, `DECISIONS.md` S9, S11, S12).

```text
Admin -> hosted Sanity Studio -> published documents in Sanity ---------+
                                                                         |  CONTENT_SOURCE=sanity
src/content/*.json --(src/lib/from-json.ts)--> the same documents -------+  (default: json)
        |                                                                |
        +--> npm run sanity:import-file -> sanity-import/ -> npm run sanity:import (Dávid, signed in)
                                                                         v
                                              npm run build -> dist/ (static) -> host (not chosen)
Click-to-edit (local): Studio "Edit on the page" <-> npm run preview:edit (drafts, per request)
Planned: hosted preview; Sanity webhook -> rebuild.
```

## Click-to-edit preview (`npm run preview:edit` locally, `npm run preview:build` for Cloudflare)

```
Studio (forro-budapest.sanity.studio, or npm run studio at localhost:3333)
   |  tool "Edit on the page" (Presentation): opens /preview/enable/?sanity-preview-secret=...
   |  first, then shows the page in a frame, talks to the page script, opens the clicked field
   v
the preview: PREVIEW=1, output 'server'             astro.config.mjs; injects preview-client.ts
   locally   astro dev, localhost:4322, reads .env  and the route /preview/enable/
   online    Cloudflare Worker forro-budapest-preview (wrangler.jsonc, @astrojs/cloudflare;
             SANITY_VIEWER_TOKEN is a Cloudflare secret; no file reads)
   |
   +- src/preview/enable.ts     -> preview-lock.ts enablePreview(): checks the Studio secret with
   |                               Sanity, sets the signed cookie fb-preview, redirects to the page
   +- src/middleware.ts         each page: previewUnlocked()? drafts : published
   |                            -> loadPreviewDocuments() -> withDocuments(docs, render the page)
   +- src/lib/source.ts         client, Viewer token (drafts only), stega markers (filter)
   +- src/lib/content.ts        same helpers; per-request documents (AsyncLocalStorage);
   |                            photos noted -> editAttr() -> data-sanity on <img>
   +- src/lib/preview-client.ts @sanity/visual-editing: outlines, clicks; after an edit fetches
                                the page again and swaps <body> content (no reload)
```

Without `PREVIEW=1` none of this exists in the output (`npm run check` [7]); [8] builds the Cloudflare version and runs it in `wrangler dev` against a stand-in for Sanity (`scripts/lib/fake-sanity.mjs`; `SANITY_API_HOST` points the preview at it, for tests only).

## Hosting (`docs/HOSTING.md`, `DECISIONS.md` S11)

| Worker | Config | Build command | Deploy command | Settings in Cloudflare |
|---|---|---|---|---|
| `forro-budapest-preview` | `wrangler.jsonc` | `npm run preview:build` | `npx wrangler deploy` | secret `SANITY_VIEWER_TOKEN` |
| `forro-bp-website` | `wrangler.site.jsonc` | `CONTENT_SOURCE=sanity npm run build` | `npx wrangler deploy --config wrangler.site.jsonc` | build variable `SITE_URL`; deploy hook called by the Sanity webhook |

The Studio's preview address: `studio/.env.production` (`SANITY_STUDIO_PREVIEW_URL`, not secret); `npm run studio:deploy` checks it first. Rollback: the Worker > Deployments > Rollback. `npm run preview:local` builds the Cloudflare preview and runs it at localhost:4323 (wrangler reads `SANITY_VIEWER_TOKEN` from the git-ignored `.env`).

## Data flow of a build

```
npm run build
   1. scripts/optimize-images.mjs   public/uploads/*  ->  public/_img/*.webp + manifest.json
   2. astro build
        src/lib/source.ts       loads the documents (CONTENT_SOURCE), once
        src/lib/from-json.ts    (json) converts src/content to documents
        src/lib/content.ts      settings, pages, people, links, images, rich text, block grouping
        src/lib/i18n.ts         languages, fixed wording, the tr() fallback helper
        src/pages, layouts, components   render HTML for every language
   v
dist/   plain static files
```

Nothing runs on a server. Browser JavaScript is two small inline scripts: the menu button (`Base.astro`) and the language redirect on `/` (`pages/index.astro`). The site works without either.

## File map

| Path | Responsibility |
|---|---|
| `studio/sanity.config.ts` | The Studio: menu (structure), "Edit on the page" (preview address, which address opens which document), fixed settings documents, new-document templates |
| `studio/sanity.cli.ts` | Project `8hc671sk`, dataset `production`, Studio address `forro-budapest` |
| `studio/schemaTypes/documents.ts` | Settings, page and person documents |
| `studio/schemaTypes/blocks.ts` | The page blocks and `BLOCK_TYPES` |
| `studio/schemaTypes/shared.ts` | Two-language field pairs, block style fields, rich text, image with alt text, link rule |
| `src/lib/source.ts` | Loads the documents: JSON, Sanity HTTP API, or an `.ndjson` file; in preview, the drafts with stega markers (`loadPreviewDocuments`, the marker filter) |
| `src/middleware.ts` | Preview only: loads the latest drafts before every page; does nothing in a build |
| `src/lib/preview-client.ts` | Preview only: the click-to-edit script in the page (reload after edits, address sync with the Studio) |
| `src/lib/from-json.ts` | JSON files -> Sanity documents. Used by the site and the import file; runs in plain Node too |
| `src/lib/content.ts` | The only place pages get content from: `getSite`, `getFestival`, `getCommunity`, `getPages`, `getPeople`, `peopleForBlock`, `blockLink`, `groupBlocks`, `renderRich`, `getImage`, `href`, `withBase`, `safeUrl`, `trFirst`, `warnOnce` |
| `src/lib/schema.ts` | Forgiving field types: `text`, `flag`, `num`, `textList` |
| `src/lib/i18n.ts` | `LANGS`, the fixed wording (`UI`), `tr(obj, 'field', lang)` |
| `src/components/Blocks.astro` | Renders a list of blocks in bands |
| `src/components/PageView.astro` | One editor-made page: top photo, heading, blocks |
| `src/components/Hero.astro`, `PageTitle.astro`, `PersonList.astro`, `Picture.astro` | Banner, title band, people cards, responsive photo (Sanity or local) |
| `src/layouts/Base.astro` | Head tags, header with menu built from pages, footer. Takes `lang`, `section`, `pagePath`, `tone` |
| `src/pages/index.astro` | `/`: redirect to a language |
| `src/pages/[lang]/index.astro`, `[lang]/[slug].astro` | Community home and community pages |
| `src/pages/[lang]/festival/index.astro`, `festival/[slug].astro` | Festival home and every festival page |
| `src/pages/404.astro` | Not found, both languages |
| `src/content/` | The proof-of-concept content (JSON); the migration source |
| `public/uploads/` | Photos of the JSON content. `public/_img/` is generated; never edit it |
| `src/styles/global.css` | All styling; colours and fonts at the top; page blocks at the end |
| `scripts/make-sanity-import.mjs` | `npm run sanity:import-file`: writes `sanity-import/` (ignored by Git) |
| `scripts/check.mjs` | `npm run check`: schema check, six test builds, and that the preview stays out of public builds [7] |
| `scripts/check-schema.mjs`, `scripts/lib/` | Documents vs Studio schema; Node loader for Studio files; Sanity-shaped test content |
| `scripts/optimize-images.mjs` | Photo resizing before every build |
| `.github/workflows/check.yml` | Runs `npm run check` on pull requests and code pushes to `main`. (The Pages CMS forms and the GitHub Pages deploy were removed 2026-11-23; see tag `pages-cms-poc`) |
| `astro.config.mjs` | Reads `SITE_URL` and `SITE_BASE`; trailing slashes. With `PREVIEW=1`: on-request rendering, `.env`, the editing script |
| `.env.example` | Names the preview's setting (`SANITY_VIEWER_TOKEN`); the real `.env` is git-ignored |

## Rules the code follows

1. **Pages never read raw content.** They call helpers in `src/lib/content.ts`.
2. **Every field is optional in the code.** "Required" lives in the Studio schema. Content problems become `[content-warning]` lines, never failures. The only deliberate failures are a malformed JSON file and, with `CONTENT_SOURCE=sanity`, an unreachable or empty Sanity (`SPEC.md` P3).
3. **Two-language fields are always read with `tr()`** (or `trFirst`, `trRich`), which fall back to the other language. Never read `x_en` or `x_hu` directly in a page.
4. **Every page takes its language from the address** (`Astro.params.lang`) and passes `lang`, `section` and `pagePath` to `Base`. `pagePath` is the address without the language (`/festival/program/`); the language switch, the menu marker and `hreflang` depend on it.
5. **Never write an address by hand.** Use `href(lang, '/festival/...')` for pages and `withBase()` for anything else; `safeUrl()`, `getImage()` and `renderRich()` already apply the base path (and the language, for site links written without one).
6. **Links go through `safeUrl` or `blockLink`; photos through `getImage` or `Picture`.**
7. **Outside requests: only Sanity's photos and, when a Video block is used, YouTube without cookies or Vimeo** (`DECISIONS.md` S4, S5). Fonts come from the `@fontsource-variable` packages.
8. **The JSON conversion and the Studio schema stay in step.** `npm run check` [0] fails when a converted document has a field the schema does not.

## Astro 7 specifics (this repo uses Astro 7.4)

- No content collections: `src/lib/source.ts` loads all documents once with a top-level `await`, and `content.ts` reads from that through `useDocuments()`; the preview calls it again on every request. `z` comes from `astro/zod`.
- Page routes look their page up by address (`getPages(...).find`) instead of receiving it from `getStaticPaths`, because in preview `getStaticPaths` is not used.
- `from-json.ts`, `schema.ts` and `i18n.ts` also run in plain Node (Node strips the types). Import between them with the `.ts` ending, and use no Astro-only modules there.
- `getStaticPaths` is hoisted; it cannot use variables declared outside it. Imports are fine.
- Astro 7 needs Node 22.23.4 or newer.
- `create-astro` templates could not be downloaded in the sandbox this was built in; the project was set up by hand.

## Gotchas

- `lib/content.ts` finds `public/_img/manifest.json` through `process.cwd()`, so builds must run from the project root (npm scripts do).
- `public/_img` is regenerated on every build; never commit or edit it.
- The phone menu depends on the `js` and `menu-open` classes the inline script puts on `<html>`. Without the script the menu is visible by default; keep it that way.
- The header is sticky and the open phone menu is positioned below it using `--header-h` in `global.css`. If the header height changes, change that variable.
- The one-row desktop header starts at 1180 px because the menu does not fit below that. Adding a menu entry or a longer word means re-testing 1180 px in both languages and raising the breakpoint if it overflows.
- A page's address (`slug`) is its address in both languages. Changing it breaks saved links; the Studio says so.
- Sanity document ids must not contain dots: dotted ids are hidden from public reads.
- In preview, texts end in invisible marker characters. Never compare or parse a text field (`_en`/`_hu`, names) in code; if a new field holds a value the code compares or uses as an address, check it is not caught by the marker filter in `source.ts`.
- A component with a `<script>` imported by `Base.astro` is bundled into every build even when not rendered. Preview-only browser code goes through the integration in `astro.config.mjs`.
- In an import file the upload instruction `_sanityAsset` belongs on the photo object, not inside `asset`.

## How to change things

### Add a colour choice

A string field with `options: { colourPicker: 'page' | 'block' | 'optional' }` shows the palette as swatches (`studio/components/ColourInput.tsx`, attached in `studio/sanity.config.ts`). On the site, check the value with `knownColour()` and use the classes `bg-<id>` / `tone-<id>` or the variables `--c-<id>` and `--c-<id>-text` (written into every page by `Base.astro`). The built-in colours are in `src/lib/palette.ts` and `studio/schemaTypes/palette.ts`; keep both the same.

### Add a field to something that exists

1. `studio/schemaTypes/`: add the field (a `localizedFields` pair if it has two languages). Give it a title and, if useful, a description the admin understands.
2. The component that shows it: read it with `tr()` if it has two languages, `safeUrl` if it is a link, `getImage`/`Picture` if it is a photo.
3. If the JSON files have a matching value, map it in `src/lib/from-json.ts`.
4. `SPEC.md` section 11, the admin guide if she will use it, `npm run check`, `npm run studio:build`.

### Add a new block

1. `studio/schemaTypes/blocks.ts`: define it with `groups: blockGroups`, `...blockStyleFields()` and a `preview`; add it to `blockTypes` and `BLOCK_TYPES`.
2. `src/components/Blocks.astro`: add it to `KNOWN` and a `case` that renders it; styles at the end of `global.css`.
3. `scripts/lib/sanity-fixture.mjs`: use it on the "everything" page; add an assertion in `scripts/check.mjs` [6].
4. `SPEC.md` P9 and the block table in `docs/EDITING-GUIDE.md`.

### Add a new kind of document (for example classes on the community level)

Schema in `documents.ts` and the Studio menu in `sanity.config.ts`; add the type to `DOCUMENT_TYPES` in `src/lib/source.ts`; a helper in `content.ts` that sorts and warns about anything it skips; a block or a page that shows it; test content and assertions; `SPEC.md`, and `DECISIONS.md` if it is a real decision.

### Add a page

No code: the admin creates it in the Studio. A page with a fixed layout that is not made of blocks: add a file under `src/pages/[lang]/` with `getStaticPaths` returning `LANGS`, wrap it in `Base`, and reserve its address in `RESERVED` (`content.ts`) and `RESERVED_SLUGS` (`documents.ts`).

### Change fixed wording or add a language

Wording: edit `UI` in `src/lib/i18n.ts`, same key in every language.
A third language: add it to `LANGS`, `LANG_LABEL`, `LANG_NAME` and `UI`; add `_xx` fields to the schemas and to the Studio schema (`studio/schemaTypes`); add the `og:locale` case in `Base.astro`. The forms get long with three languages; reconsider decision 5 first.

### Change the design

Colours and fonts: the variables at the top of `src/styles/global.css`. Layout: that file and the markup in `src/components` and `src/pages`. Keep calling the same helpers and keep rules 3 to 6. Then run `npm run check` and the browser checks in `HANDOFF.md`.
To change a font: install the `@fontsource-variable/<name>` package with an exact version, import it in `Base.astro`, and set the variable in `global.css`.

### Switch the site to Sanity, or change the host

After the import (`SANITY-PORT-STATUS.md`), set `CONTENT_SOURCE=sanity` in the host's build settings. Build command `npm run build`, output `dist`, Node 22.23.4 or newer, `SITE_URL` set to the real address (`SITE_BASE` only under a sub-path). `SANITY_READ_TOKEN` only if the dataset is private, as a secret.

### Upgrade Astro, Node or another dependency

Change the exact versions in `package.json` and `.node-version` (Cloudflare's builds read `.node-version`), run `npm install`, then `npm run check` and the browser checks.

### Change the Sanity content model

Edit `studio/schemaTypes/`, then `cd studio && npx sanity schema validate`, `npm run studio:build` and `npm run check` (its section 0 compares the converted documents with the schema). A field renamed or removed in the schema keeps its old value in Sanity documents until they are edited or migrated; keep the site tolerant of both, or write a migration. Deploy the Studio with `npm run studio:deploy` (needs Sanity sign-in).
