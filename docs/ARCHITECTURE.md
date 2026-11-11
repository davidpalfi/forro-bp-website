# Architecture

How the code is organised and how to change it safely. For what the site does, see `SPEC.md`; for why it is built this way, see `DECISIONS.md`.

## Data flow

```
Editor (Pages CMS forms)
   |  a save = a commit to main
   v
GitHub repository:  src/content/**  and  public/uploads/**
   |  the push starts .github/workflows/deploy.yml
   v
npm run build
   1. scripts/optimize-images.mjs   public/uploads/*  ->  public/_img/*.webp + manifest.json
   2. astro build
        src/content.config.ts   loads the people and pages collections (forgiving)
        src/lib/content.ts      settings, people, pages, links, images, text rendering
        src/lib/i18n.ts         languages, fixed wording, the tr() fallback helper
        src/pages, layouts, components   render HTML for every language
   v
dist/   plain static files, published to GitHub Pages
```

Nothing runs on a server. Browser JavaScript is two small inline scripts: the menu button (`Base.astro`) and the language redirect on `/` (`pages/index.astro`). The site works without either.

## File map

| Path | Responsibility |
|---|---|
| `src/content/settings/site.json` | Community name, main language, contact, "hide from Google" |
| `src/content/settings/community.json` | Community home page (nearly empty on purpose) |
| `src/content/settings/festival.json` | Festival home, ticket link, program images, page headings |
| `src/content/people/*.json` | One file per teacher or artist |
| `src/content/pages/*.json` | One file per festival text page; the file name is the address |
| `public/uploads/` | Uploaded photos (committed). `public/_img/` is generated and ignored by Git |
| `.pages.yml` | The editing forms. Must mirror the content model |
| `src/content.config.ts` | Declares the two collections and their forgiving shape |
| `src/lib/schema.ts` | Forgiving field types: `text`, `flag`, `num`, `textList` |
| `src/lib/i18n.ts` | `LANGS`, the fixed wording in each language (`UI`), and `tr(obj, 'field', lang)` |
| `src/lib/content.ts` | The only place pages get content from: settings, people, pages, `href`, `withBase`, `safeUrl`, `getImage`, `paragraphs`, `renderBody` |
| `src/layouts/Base.astro` | Head tags, header (brand, date, language switch, menu), footer. Takes `lang`, `section`, `pagePath` and optionally `tone` (page background: `red`, `dark` or `cream`) |
| `src/pages/index.astro` | `/`: redirect to a language |
| `src/pages/[lang]/index.astro` | Community home |
| `src/pages/[lang]/festival/index.astro`, `program.astro`, `teachers.astro`, `artists.astro`, `[slug].astro` | The festival |
| `src/pages/404.astro` | Not found, both languages |
| `src/components/Hero.astro`, `PageTitle.astro`, `PersonList.astro`, `Picture.astro` | Banner, red title band, people list, responsive photo |
| `src/styles/global.css` | All styling; colours and fonts as variables at the top |
| `scripts/optimize-images.mjs` | Photo resizing before each build |
| `scripts/check.mjs` | `npm run check`: four test builds with assertions |
| `scripts/ci-build.mjs` | The build as run on GitHub; copies warnings to the run summary |
| `.github/workflows/deploy.yml` | Build once and deploy, on every push to `main` |
| `.github/workflows/check.yml` | `npm run check`, only when code changes and on pull requests |
| `astro.config.mjs` | Reads `SITE_URL` and `SITE_BASE`; trailing slashes |
| `.node-version`, `package.json`, `package-lock.json` | Pinned Node and six exactly pinned dependencies: `astro`, `sharp`, `marked`, three `@fontsource-variable/*` fonts |

## Rules the code follows

1. **Pages never read raw files.** They call helpers in `src/lib/content.ts`.
2. **Every field is optional in the code.** "Required" lives only in `.pages.yml`. Problems become `[content-warning]` lines, never failures.
3. **Two-language fields are always read with `tr()`**, which falls back to the other language. Never read `x_en` or `x_hu` directly in a page.
4. **Every page takes its language from the address** (`Astro.params.lang`) and passes `lang`, `section` and `pagePath` to `Base`. `pagePath` is the address without the language (`/festival/program/`); the language switch, the menu marker and `hreflang` all depend on it being right.
5. **Never write an address by hand.** Use `href(lang, '/festival/...')` for pages and `withBase()` for anything else; `safeUrl()` and `getImage()` already apply the base path. HTML from text bodies goes through `renderBody()`, which also rewrites root-relative links. `npm run check` section 4 fails if an address ignores the base.
6. **Links go through `safeUrl`; photos go through `getImage`** (or the `Picture` component).
7. **No third-party requests.** Fonts come from the `@fontsource-variable` packages, imported in `Base.astro`.

## Astro 7 specifics (this repo uses Astro 7.4)

- `defineCollection` comes from `astro/content/config`, the `glob` loader from `astro/loaders`, `z` from `astro/zod`. The collections file is `src/content.config.ts`.
- Entry ids are generated from file names (`generateId` in `content.config.ts`).
- `getStaticPaths` is hoisted; it cannot use variables declared outside it. Imports are fine.
- Astro 7 needs Node 22.23.4 or newer.
- `create-astro` templates could not be downloaded in the sandbox this was built in; the project was set up by hand.

## Gotchas

- `lib/content.ts` finds `public/_img/manifest.json` through `process.cwd()`, so builds must run from the project root (npm scripts do).
- `public/_img` is regenerated on every build; never commit or edit it.
- The phone menu depends on the `js` and `menu-open` classes the inline script puts on `<html>`. Without the script the menu is visible by default; keep it that way.
- The header is sticky and the open phone menu is positioned below it using `--header-h` in `global.css`. If the header height changes, change that variable.
- The one-row desktop header starts at 1180 px because the menu does not fit below that. Adding a menu entry or a longer word means re-testing 1180 px in both languages and raising the breakpoint if it overflows.
- A text page's file name is its address in both languages. Renaming the file changes the address and breaks links to it.
- In `.pages.yml`, `{primary}` in a file name pattern is the primary field's value; how it treats accented letters is unverified.
- Pages CMS's stored value formats were assumed from its docs, not observed. See the assumptions table in `DECISIONS.md`.

## How to change things

### Add a field to something that exists

1. `src/content.config.ts` (people, pages) or the schema in `src/lib/content.ts` (settings files): add the field with a helper from `lib/schema.ts`. For a two-language field add both `x_en` and `x_hu`.
2. `.pages.yml`: add the form field or fields in the same place.
3. The page or component that shows it: read it with `tr()` if it has two languages, `safeUrl` if it is a link.
4. Add a value to a content file, a line in `SPEC.md` section 5, and run `npm run check`.

### Add a new kind of content (for example classes on the community level)

1. Create the folder under `src/content/` with a sample file.
2. `content.config.ts`: a new `defineCollection` with `generateId: idFromFile`; add it to `collections`.
3. `lib/content.ts`: a `getX()` helper that sorts and warns about anything it skips.
4. A page under `src/pages/[lang]/...` with `getStaticPaths` returning every language.
5. `.pages.yml`: a new `content` entry.
6. `scripts/check.mjs`: add an assertion. `SPEC.md` and, if it is a real decision, `DECISIONS.md`.

### Add a page (route)

Add a file under `src/pages/[lang]/`, export `getStaticPaths` that returns `LANGS`, wrap it in `Base` with the right `section` and `pagePath`. Add it to the menu in `Base.astro`, its menu word to both languages in `i18n.ts`, and, if it sits under `/festival/`, its name to `RESERVED_SLUGS` in `lib/content.ts`.

### Add a text page without code

Use the editor (Festival > Text pages), or add a JSON file in `src/content/pages/`.

### Change fixed wording or add a language

Wording: edit `UI` in `src/lib/i18n.ts`, same key in every language.
A third language: add it to `LANGS`, `LANG_LABEL`, `LANG_NAME` and `UI`; add `_xx` fields to the schemas and to `.pages.yml`; add the `og:locale` case in `Base.astro`. The forms get long with three languages; reconsider decision 5 first.

### Change the design

Colours and fonts: the variables at the top of `src/styles/global.css`. Layout: that file and the markup in `src/components` and `src/pages`. Keep calling the same helpers and keep rules 3 to 6. Then run `npm run check` and the browser checks in `HANDOFF.md`.
To change a font: install the `@fontsource-variable/<name>` package with an exact version, import it in `Base.astro`, and set the variable in `global.css`.

### Swap the editing tool or the host

Editor: the content files do not change. Replace `.pages.yml` with the new tool's configuration and re-check the stored value formats.
Host: any static host. Build command `npm run build`, output folder `dist`, Node 22.23.4 or newer, `SITE_URL` set to the real address (`SITE_BASE` only under a sub-path).

### Upgrade Astro, Node or another dependency

Change the exact versions in `package.json` and `.node-version` (and `node-version` in `deploy.yml`), run `npm install`, then `npm run check` and the browser checks.
