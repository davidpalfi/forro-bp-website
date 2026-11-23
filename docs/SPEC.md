# Specification

What the original Pages CMS proof of concept does and how it behaved when checked on 2026-11-11. Requirement IDs (R1, R2, ...) refer to that baseline. The Sanity version on `feature/sanity` is described in section 11, which wins where they differ. For current status and decisions, see `HANDOFF.md` and `DECISIONS.md`.

## 1. Purpose and users

One website for the Forró Budapest community. The community level is an empty shell for now; the Budapest Forró Festival is a section below it. It replaces the festival's Wix site and copies its look. The festival's admin edits the content herself.

| User | Main tasks |
|---|---|
| Visitor (mostly on a phone) | See what the festival is and when; see the program; see teachers and artists; buy tickets; find the venue and the code of conduct; switch between English and Hungarian |
| Admin (non-technical, a designer) | Change texts in both languages, replace photos and program images, add or remove people and text pages. Without a developer, without a GitHub account |
| Maintainer (developer, or Claude working for one) | Change the structure and design, fix problems, deploy |

## 2. Scope

In scope: the pages in section 3, the content model in section 5, editing through forms, building and hosting as a static site.

Out of scope: content for the community level (not designed), a structured (text) program, ticket sales (linked to an external platform), visitor accounts, payments, search, analytics, contact forms, embedded video or maps.

## 3. Pages and addresses

`<lang>` is `en` or `hu`. Every page exists in both.

| Address | Page | Source |
|---|---|---|
| `/` | Sends the visitor to `/<lang>/` (R3) | `site.json` |
| `/<lang>/` | Community home | `settings/community.json`, `festival.json` |
| `/<lang>/festival/` | Festival home | `settings/festival.json`, text pages |
| `/<lang>/festival/program/` | Program | `festival.json` |
| `/<lang>/festival/teachers/` | Teachers | people with group Teacher |
| `/<lang>/festival/artists/` | Artists | people with group Artist |
| `/<lang>/festival/<name>/` | Text page, one per file in `src/content/pages/` | that file |
| `/404.html` | Page not found, in both languages | fixed wording |

- **R1.** Under `/festival/`, the names `program`, `teachers` and `artists` are reserved. A text page with one of these file names is skipped with a `[content-warning]`.
- **R2.** All addresses end with a slash. The whole site is plain files; nothing runs on a server.
- **R3. Root.** `/` goes to `/hu/` or `/en/` according to the first matching language in the browser's preferences, otherwise to `defaultLang`. Without JavaScript it goes to `defaultLang`. The page also lists both languages as links.

## 4. Page behaviour

### 4.1 Every page

- **R4. Head.** `<title>` is "Page title | Section name" (section name alone on the two home pages; the section is the festival name or the community name). Meta description: the page's own, else the section's tagline in that language. Canonical URL. `hreflang` links to both languages and `x-default`. Open Graph title, description, URL, locale and image (the page's own photo, else the section's banner photo). `lang` attribute is the page's language.
- **R5. Indexing.** When `noindex` in `site.json` is true (the default), every page carries `robots: noindex, nofollow`.
- **R6. Skip link** to the main content is the first focusable element, in the page's language.
- **R7. Header** (stays at the top while scrolling): the brand, the language switch, the menu.
  - Brand: in the festival, the small festival logo (`headerLogo`; without it the big banner logo; the festival name as text when neither is uploaded), linking to the festival home. On the community level, the community name, linking to the community home.
  - Language switch: a drop-down showing the current language's flag, `EN`/`HU` and an arrow; it opens a list (flag and "English"/"Magyar") linking to the same page in each language, the current one marked. It works without JavaScript (`<details>`); with it, Escape or a click elsewhere closes it. On computers it sits between the menu and the Tickets button; on phones beside the menu button.
  - Festival menu, in order: Home (the festival home), Program, Teachers, Artists, text pages with `showInMenu` (by `order`, then title; shown with their `menuLabel` when set), the community name (link up to the community home), and a cream "Tickets" button (new tab) when `ticketUrl` is a safe link. Community menu: one link to the festival.
  - From 1180 px (the one-row header) the festival's date line (the same `dateLine` as on the banner) is also shown next to the brand.
  - The current page has `aria-current="page"`.
  - Below 1180 px the menu is behind a button and opens as a full-screen panel; Escape closes it. From 1180 px everything sits in one row, in capitals. Without JavaScript the menu is always visible instead.
- **R8. Footer.** "© year community name", contact email (`mailto:`), Instagram link shown as the Instagram icon (the festival's inside the festival, else the community's) and Facebook link when set, and the footer note. Each part is left out when empty. Stacked and centred on phones; in one row from 860 px (copyright left, the rest right).
- **R8a. Page background.** Red on the home pages, program, teachers, artists and 404; cream with dark text on text pages. The cream background is the Wix paper texture (`src/styles/paper-cream.webp`, 2026-11-23).

### 4.2 Community home (`/<lang>/`)

Banner with the community title over the banner photo; the intro paragraphs when written; then the festival name, its date line and a button to the festival. Nothing else yet.

### 4.3 Festival home

1. **Banner.** Banner photo (on phones the phone banner photo, when one is uploaded); the big logo (`logo`, or festival name as text); the ticket button (needs a safe `ticketUrl`; label falls back to "Tickets"/"Jegyek"; new tab); the date line. Centred on phones; from 900 px the block sits to the left over the photo.
2. **Intro.** Each blank-line-separated block is a paragraph. Left out when empty.
3. **Closing block.** The line of numbers (`stats`); one button per text page with `showOnHome`. No second ticket link (removed 2026-11-23: the banner and the header have one).

### 4.4 Program

Heading (`programHeading`, else "Program"). The `programImages` in order, one under the other at up to about 1150 px wide, the same in both languages. Then `programText` when written. Image alt text is "Program – festival name (n)".

### 4.5 Teachers and Artists

Heading (`teachersHeading` / `artistsHeading`, else the menu word). Then each person of that group, by `order` (default 100) then name, as a dark card on the red page: photo (cropped to 4:3 on phones, square from 860 px), role (when set), name, bio paragraphs, and the gold Instagram icon (`public/icons/instagram-gold.png`, linked in a new tab, read as "Instagram – name") at the bottom of the card when the link is safe. One card per row on phones, two side by side from 860 px. A person whose group is missing or unknown is shown with the teachers, with a warning.

### 4.6 Text pages

The optional top photo across the full width, then on a cream background: the title, the body, and the optional photo gallery (two columns on phones, three from 720 px).

## 5. Content model

All content is plain JSON files under `src/content/`. **Form** = what the editing form enforces (`.pages.yml`). The code never fails on a missing or wrong-typed value (R12).

**Two-language fields** are written `name_en` / `name_hu` below as `name_*`. **R9.** When one language is empty the other is shown.

### 5.1 `settings/site.json`

| Field | Form | Use |
|---|---|---|
| `name` | required | Community name: brand, footer, titles. Default "Community" |
| `defaultLang` | `en` or `hu` | R3. Anything else counts as `en` |
| `tagline_*` | | Meta description on the community level |
| `email` | | Footer |
| `instagram`, `facebook` | https only | Footer |
| `footerNote_*` | | Footer |
| `noindex` | default yes | R5 |

### 5.2 `settings/community.json`

`title_*` (banner title; falls back to the community name), `heroImage`, `intro_*` (multi-line).

### 5.3 `settings/festival.json`

| Field | Form | Use |
|---|---|---|
| `name` | required | Brand text, titles. Default "Festival" |
| `logo` | image | Big logo on the banner (and in the header when `headerLogo` is empty); text is used when empty |
| `headerLogo` | image | Small logo in the header of every festival page (2026-11-23) |
| `heroImage` | image | Festival banner; default sharing image |
| `heroImagePhone` | image | Optional taller banner used below 720 px |
| `dateLine_*` | | Banner; also on the community home |
| `ticketUrl`, `ticketLabel_*` | https only | Ticket buttons |
| `intro_*` | multi-line | Festival home |
| `stats_*` | | The line of numbers |
| `instagram` | https only | Footer inside the festival |
| `tagline_*` | | Meta description inside the festival |
| `programHeading_*`, `programImages` (list of images), `programText_*` (rich text) | | Program page |
| `teachersHeading_*`, `artistsHeading_*` | | Page headings |

### 5.4 `people/*.json`

| Field | Form | Use |
|---|---|---|
| `name` | required | Falls back to the file name |
| `group` | required: Teacher or Artist | Which page (case ignored) |
| `role_*` | | Small label above the name |
| `photo` | JPG, PNG or WebP | Missing file: no photo, with a warning |
| `bio_*` | multi-line | Paragraphs: an empty line starts one; a line with only invisible characters (from copied text) counts as empty |
| `instagram` | https only | Link |
| `order` | number | Default 100; lower first |

### 5.5 `pages/*.json` (text pages of the festival)

| Field | Form | Use |
|---|---|---|
| `title_*` | English required | Falls back to the other language, then the file name |
| `menuLabel_*` | | Menu word when it should differ from the title ("Location" for a page titled "Venue") |
| `body_*` | rich text | Markdown or HTML; both are rendered |
| `image` | image | Shown under the title; sharing image |
| `gallery` | list of images | Grid at the bottom |
| `showInMenu` | default yes | Festival menu |
| `showOnHome` | default no | Button on the festival home |
| `order` | number | Default 100 |

The file name is the address in both languages (`location.json` gives `/en/festival/location/` and `/hu/festival/location/`).

### 5.6 Photos

Stored in `public/uploads/`; content refers to them as `/uploads/<file>`.

### 5.7 Fixed wording

Menu words, "Skip to content", the ticket-button fallback, "Instagram" and the 404 texts live in `src/lib/i18n.ts` in both languages. They are not editable in the forms.

## 6. Rules

- **R10. Links** are rendered only when they start with `https://`, `http://`, `mailto:` or a single `/`. Anything else (for example `javascript:`) is dropped, also inside text-page bodies.
- **R11. Photos.** At build time each JPG, PNG or WebP in `public/uploads/` gets WebP copies 480, 960 and 1600 px wide (never enlarged). Pages use them with `srcset` and the original's width and height. Phone rotation is respected. A photo that cannot be processed is served as it is, with a warning. A referenced photo that does not exist is left out, with a warning. A photo over 8 MB works but gets a warning. Photos load lazily except banners and the first program image.
- **R12. Tolerance.** Wrong types are converted (a number in a text field becomes text; "yes" or "true" counts as true; a single text where a list belongs becomes a one-item list). Only unreadable file syntax (broken JSON) fails a build.
- **R13. Warnings never block publishing.** They are printed as `[content-warning]` lines and listed on the GitHub run summary.
- **R14. Ordering** is by `order` (default 100), then name or title.

## 7. Editing and publishing

- **R15.** Everything the admin can change is a form with plain labels and hints: Festival (home page, program and headings; teachers and artists; text pages), Community home page, Site settings.
- **R16.** Required fields cannot be left empty in the form. Link fields must start with `https://`.
- **R17.** Photos can be uploaded in any size, as JPG, PNG or WebP.
- **R18.** A push to `main` (which is what a save in the editor is) runs one build and deploys. If the build fails, the previous version stays online.
- **R19.** `npm run check` runs automatically only for changes outside `src/content` and `public/uploads`, and on pull requests.
- **R20.** The site works at any address: a custom domain or a sub-path such as `name.github.io/repo-name/`, set by `SITE_URL` and `SITE_BASE`.
- **R21.** Dependency and Node versions are pinned.

## 8. Non-functional requirements

- **Performance and privacy.** No requests to third parties: fonts are served from the site, no trackers, no embeds, no cookies, so no consent banner.
- **Accessibility.** Semantic headings, skip link, visible keyboard focus, current-page and current-language markers, a labelled menu button with `aria-expanded`, link texts that name the person on Instagram links, reduced motion respected. Known gaps: people photos have empty alt text (the name is next to them); the program is images, so its content is not available to screen readers unless the optional text is filled in; no formal audit.
- **Responsive.** Phone first; breakpoints at 720, 860, 900, 1180 and 1400 px. No horizontal scrolling from 320 px up.
- **Without JavaScript.** Everything works; the menu is shown open, and `/` goes to the default language.
- **Design.** Colours, shapes and layout follow the Wix festival site (red, cream, dark inner pages, grey footer, torn-paper ticket button). The ticket buttons use the Wix button shapes with live text. Paragraphs (text blocks and bios) are justified, without hyphenation, as on Wix (Dávid, 2026-11-23); centred and right-aligned blocks keep their alignment. Deliberate differences: the menu has one extra entry, the link up to the community home.

## 9. Acceptance criteria

A = automated by `npm run check`. M = by hand (see `HANDOFF.md`).

| # | Criterion | How | State |
|---|---|---|---|
| AC1 | The build passes on a clean install | A | passes |
| AC2 | Every page in section 3 exists in both languages | A | passes |
| AC3 | Every person is on the page of their group, in both languages | A | passes |
| AC4 | Language versions declare their language, link to each other, and the switch leads to the same page | A | passes |
| AC5 | No `javascript:` link and no broken local link, image or srcset URL | A | passes |
| AC6 | The `noindex` tag matches the setting | A | passes |
| AC7 | No third-party font, script or tracker addresses in the output | A | passes |
| AC8 | Broken content (null and wrong-typed fields, missing photos, unsafe links, a reserved page name, an invalid main language, an oversized file) still builds, falls back, and logs warnings | A | passes |
| AC9 | A missing translation falls back to the other language, both ways | A | passes |
| AC10 | A malformed JSON file fails the build (known limit) | A | passes |
| AC11 | With `SITE_BASE=/repo-name`, every link, photo, the root redirect and the sharing image carry the base path | A | passes |
| AC12 | No horizontal scrolling at eleven widths from 320 to 1920 px in both languages; no console errors; the menu button opens the menu; `/` redirects by browser language and without JavaScript | M | done once in a sandbox, 2026-11-11 |
| AC13 | All forms appear in Pages CMS with the described fields | M | not done |
| AC14 | An invited editor without a GitHub account signs in on a phone, adds a person with a photo and both bios, and sees it live | M | not done |
| AC15 | The workflows run on GitHub; a save in Pages CMS triggers a deployment; a failed build leaves the previous site live | M | not done |
| AC16 | The admin confirms the look matches her design on phone and desktop | M | not done (built from phone and desktop screenshots of the Wix site; fonts matched by eye) |

## 10. Not specified yet

- The community level: content types, pages and menu.
- Whether the program should also exist as text.
- Launch details: domain, redirects from old Wix addresses, private or public repository, failure notifications.
- A sitemap, analytics, alt-text fields for photos.

## 11. Sanity version (`main` since 2026-11-23; built on `feature/sanity`)

Sections 1 to 10 describe the Pages CMS proof of concept. This section describes the Sanity version as built on `feature/sanity` on 2026-11-17. Where it differs from sections 3 to 5, this section wins on that branch. Choices S1 to S7 are in `DECISIONS.md`.

### 11.1 Content source

- **P1.** The site is built from a set of Sanity documents: `siteSettings`, `communitySettings`, `festivalSettings` (one each, fixed ids), `page` and `person`. The schemas are in `studio/schemaTypes/`.
- **P2.** `CONTENT_SOURCE` chooses where they come from: unset or `json` = the JSON files in `src/content`, converted by `src/lib/from-json.ts`; `sanity` = the published documents in Sanity project `8hc671sk`, dataset `production`, read at build time; `file:<path>` = an `.ndjson` file of documents. Drafts (`drafts.*`) are never used.
- **P3.** With `sanity`, a failed request, an authorisation error or a dataset with no festival settings and no pages **fails the build** on purpose, so the host keeps the previous site. Every other content problem is a `[content-warning]`, as before.
- **P4.** `npm run sanity:import-file` writes `sanity-import/data.ndjson` and copies the photos it uses to `sanity-import/images/`. Document ids are fixed (`person-<file name>`, `page-<file name>`, `page-program`, ...), contain no dots, and the file is identical on every run. `npm run sanity:import` writes the file and imports it with `--missing`: only documents that do not exist yet are created. Nothing is ever deleted. `npm run sanity:import-replace` overwrites the published documents in the file with it (drafts are untouched); only for before the admin starts editing. In the file, a photo carries its upload instruction (`_sanityAsset`) on the photo object itself.

### 11.2 Mapping from the JSON files

| JSON | Sanity |
|---|---|
| `site.json` | `siteSettings`, same fields |
| `community.json` | `communitySettings`: title, banner photo; intro becomes a Large text block in `homeBlocks` |
| `festival.json` banner fields | `festivalSettings`: name, big logo, small logo, banner photo, phone banner photo, dates, ticket address and label, Instagram, tagline |
| `festival.json` intro, stats | `festivalSettings.homeBlocks`: a Large text block, a centred Statement text block |
| text pages with `showOnHome` | a centred Button block per page in `homeBlocks`, linking to the page (label empty, so the page's name is used) |
| `programHeading`, `programImages`, `programText` | page `program` (order 1, red): heading, one wide Image block per image (alt "Program – name (n)"), a Text block |
| `teachersHeading`, `artistsHeading` | pages `teachers` and `artists` (order 2 and 3, red), each with one People block for its group |
| `pages/<name>.json` | page `<name>` (cream): title, menu label, cover photo, a Text block (Markdown converted to rich text), a Gallery block; order = 10 + its order |
| `people/<name>.json` | `person-<name>`, same fields; the name is entered once |

`npm run check` section 5 proves the site built from the import file is byte-identical to the site built from the JSON files.

### 11.3 Addresses

| Address | Page |
|---|---|
| `/<lang>/` | Community home: banner, `communitySettings.homeBlocks`, then the festival band (as 4.2) |
| `/<lang>/festival/` | Festival home: banner (as 4.3), `festivalSettings.homeBlocks` |
| `/<lang>/festival/<address>/` | Every festival page, including program, teachers and artists |
| `/<lang>/<address>/` | Community pages; `festival` is reserved |

- **P5.** A page is skipped with a warning when its address is missing or not lowercase letters, digits and hyphens, when it is reserved, or when another page in the same section already has it (the one earlier in menu order wins).
- **P6. Menus.** Festival: Home, the festival pages with "Show in the menu" by menu order (then id), the community name, the Tickets button. Community: the festival, then the community pages with "Show in the menu". Label: the menu label, else the page name, in the visitor's language first.

### 11.4 A page

- **P7.** Optional photo across the top. Then the big heading (else the page name): in a band of the page colour on red and dark pages, above the content on cream pages. Then the blocks. `<title>` uses the page name; the description and sharing photo come from the page.
- **P8. Bands.** Neighbouring blocks with the same background ("Same as page" counts as the page colour) and alignment share one band. A band directly after a band of the same colour has no top padding.
- **P9. Blocks.**

| Block | Shown as |
|---|---|
| Text | Rich text at reading width. Large: serif paragraphs as the festival intro. Statement: one bold line as the numbers line (plain text) |
| Heading | h2, h3 or h4 |
| Image | Wide (up to about 1150 px), text width, or full screen width; caption below |
| Gallery | Grid, 2 columns, 3 from 720 px, photos cut to 4:3 |
| Button | Leads to the chosen page in the visitor's language (label: its own, else the page's menu name), else to the address; left out with a warning when neither is usable |
| People | The chosen people in the chosen order; with none chosen, everyone in the group by display order, then name. Cards as 4.5 |
| Banner | Photo with a dark veil (plum without photo), title, text, button |
| Columns | 2 to 4 side by side from 760 px, each with optional photo (4:3), heading, text |
| Video | YouTube (through youtube-nocookie.com) or Vimeo (`dnt=1`) in a 16:9 frame, loaded lazily; any other address is left out with a warning |
| Divider | A line, or 2 rem of space |

A block of an unknown kind is skipped with a warning. Two-language fields fall back as in section 6, per field.

- **P10. Links in rich text.** `https://`, `mailto:` and site addresses only; `javascript:` and the like are removed. A site address written without a language (`/festival/program/`) gets the visitor's language.
- **P11. Photos.** Uploaded photos come from `cdn.sanity.io` at 480, 960 and 1600 px wide (never wider than the original), with the editor's crop. When a photo is cut to a shape by the design, the editor's focus point (hotspot) decides what stays visible. The description (alt text) is used in the visitor's language. Photos in the JSON files and in a not-yet-imported import file still come from `public/uploads` as before.

### 11.5 Editor (Sanity Studio)

- **P12.** Hosted by Sanity at `forro-budapest.sanity.studio` (configured in `studio/sanity.cli.ts`, not yet deployed). Menu: Festival home page, Festival pages, Teachers, Artists, Community home page, Community pages, Everyone, Site settings. The three settings documents cannot be created again, duplicated or deleted. New people and pages created from a list get that list's group or section.
- **P13.** English and Hungarian ("Magyar") fields side by side. Every block has a Content and a Style tab. Link fields accept `https://`, `mailto:` and `/` addresses. The page address must be lowercase letters, digits and hyphens and is generated from the English name without accents.

### 11.6 Requirements still to build

- **P23. Click-to-edit polish** (planned 2026-11-18, `BACKLOG.md` A-G; A, no reload, done: P20): whole blocks outlined and clickable; right-click menu and drag to reorder if they work without React; links, e-mail and band colours clickable, fixed wording marked as not editable; the Studio's Published/Drafts switch honoured; people and site settings list where they appear.
- **P14. Hosted visual editing** (built 2026-11-18, `DECISIONS.md` S11). The click-to-edit preview (11.7) on Cloudflare Workers (`npm run preview:build`, `wrangler.jsonc`). It shows drafts only to a browser the Studio has let in through `/preview/enable/` (a one-hour Studio secret, checked with Sanity; then a signed cookie for 12 hours); a wrong or missing secret gets 401 and no cookie; the entrance only leads to a path on the preview itself. Without the cookie it shows published content and a strip at the bottom saying drafts are hidden. Each request sees only its own content. Unknown first words in the address (not `en`/`hu`) get the 404 page. Public output stays static; drafts and credentials stay out of it.
- **P15. Publish rebuild** (built 2026-11-18, not yet connected). The test site (`wrangler.site.jsonc`, static files from `CONTENT_SOURCE=sanity npm run build`) is rebuilt by a Sanity webhook calling the Worker's deploy hook when a published document of a site type is created, changed or deleted; drafts do not rebuild. A failed build deploys nothing, so the previous version stays online. Unknown addresses get the 404 page; `/en/festival` leads to `/en/festival/`.
- **P16. Admin acceptance.** The admin signs in herself, edits, publishes and confirms the result on phone and desktop before the Sanity version replaces the current site.
- **P17. Security and privacy.** Tokens only in provider secret stores, never in the repository or chat. No private care-team contact details in the repository or the dataset.

### 11.7 Click-to-edit preview (built 2026-11-18; ready for Cloudflare, P14)

- **P18. Preview mode.** `npm run preview:edit` (environment `PREVIEW=1`) serves the site at `http://localhost:4322` (beside `npm run dev` on 4321), rendering every page on request from the newest **drafts** in Sanity (drafts over published). It needs `SANITY_VIEWER_TOKEN` in the git-ignored `.env` file. Drafts appear only after the Studio has opened the preview (the lock, P14); otherwise published content, which needs no token. Responses are `no-store` and `noindex`.
- **P19. Click targets.** Texts from fields ending in `_en`/`_hu` (including rich text) and names carry invisible markers; every photo has a `data-sanity` attribute. In the Studio's **Edit on the page** view, hovering outlines them and a click opens that field. Other values (tone, group, section, address, links, e-mail) never carry markers.
- **P20. After an edit** in the Studio the preview page shows the draft without reloading: no white flash, the scroll position stays, the menu button still works (since 2026-11-18; before, it reloaded). If the update fails, the page reloads. Nothing is published by editing.
- **P21. Studio.** The tool **Edit on the page** (Presentation) shows the preview at `SANITY_STUDIO_PREVIEW_URL` (default `http://localhost:4322`; the deployed Studio takes it from `studio/.env.production`, and `npm run studio:deploy` refuses to deploy without an `https://` address), starting at `/en/festival/`, through the lock's entrance `/preview/enable/`. An address opens its document: `/<lang>/festival/` the festival home page, `/<lang>/festival/<address>/` that festival page, `/<lang>/` the community home page, `/<lang>/<address>/` that community page. Festival and community home pages and every page list where they appear on the site, in both languages. People are edited by clicking them on the page that shows them.
- **P22. Public builds are untouched.** Without `PREVIEW=1` the build is static and identical to a build without this feature: no editing script (not even bundled), no `data-sanity` attributes, no markers, no drafts.

### 11.8 Acceptance state (2026-11-18)

| ID | Criterion | How | State |
|---|---|---|---|
| AC17 | Every document the JSON conversion and the test content produce fits the Studio schema | A (`npm run check` [0]) | passes |
| AC18 | The import file has fixed, dot-free ids, all people, no un-uploaded photos, and is identical on every run | A [5] | passes |
| AC19 | The site built from the import file is identical to the site built from the JSON files | A [5] | passes |
| AC20 | Sanity-shaped content: crop and focus point, alt text, every block, language added to site links, unsafe links removed, drafts excluded, community pages and menus, the warnings in P5 and P9, only `cdn.sanity.io` and `youtube-nocookie.com` as outside sources | A [6] | passes |
| AC21 | The JSON-based site looks as before at 390 and 1280 px | M | done 2026-11-17, side by side with the previous build: same layout; the festival home's closing band and the location gallery sit slightly closer to the text |
| AC22 | Studio builds and the schema validates | A (`npm run studio:build`, `npx sanity schema validate`) | passes |
| AC23 | Studio deployed; maintainer and an invited editor can sign in | M | not done |
| AC24 | Import into `production`; the site built with `CONTENT_SOURCE=sanity` matches | M | imported by Dávid 2026-11-18 (20 documents, 6 photos), photos repaired with `npm run sanity:import-replace`; the build passes with photos from Sanity. Side-by-side look not compared yet |
| AC25 | P14 to P16 | M | P14 and P15 built and tested with a stand-in for Sanity in Cloudflare's local runtime (A [8]); not yet online; P16 not done |
| AC29 | Hosted preview: lock (wrong, missing, forged and expired secrets or cookies show no drafts), parallel requests, every page, 404s, update without reload in a browser | A [8] | passes |
| AC26 | Public builds carry no click-to-edit parts (P22); the import file puts upload instructions on the photo; a photo within a photo still shows | A [5] [6] [7] | passes |
| AC27 | Preview against the real project: every page renders, texts carry markers (also through rich text), every photo has a click target, the editing script finds them | M | done 2026-11-18 with published content; drafts with Dávid's token tried by him the same day |
| AC28 | Dávid clicks a text and a photo in **Edit on the page**, edits, sees the change without publishing, and judges whether it is clearly better than forms (S8) | M | done 2026-11-18 in Safari with drafts: approved ("pretty awesome") |
