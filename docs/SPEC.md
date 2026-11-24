# Specification

What the site does. Requirement IDs (R…, P…, AC…) are stable: other documents and commits refer to them, so keep an ID when you reword a requirement and give new requirements new IDs. Why it is built this way: `DECISIONS.md`. How the code does it: `ARCHITECTURE.md`.

## 1. Purpose and users

One website for the Forró Budapest community, with the Budapest Forró Festival as a section below it, in English and Hungarian. It replaces the festival's Wix site (forrobudapest.com) and copies its look; the community level has its own palette. The admin edits the content herself in Sanity Studio.

| User | Main tasks |
|---|---|
| Visitor (mostly on a phone) | See what the festival is and when; see the program, teachers and artists; buy tickets; find the venue and the code of conduct; see community events; switch between English and Hungarian |
| Admin (non-technical, a designer) | Change texts in both languages, photos and program images; add or remove people, pages and blocks; publish. Without a developer, without a GitHub account |
| Maintainer (developer, or Claude working for one) | Change the structure and design, fix problems, deploy |

## 2. Scope

In scope: the pages and blocks below, editing in Sanity Studio (forms and click-to-edit), a static public site rebuilt on Publish.

Out of scope: ticket sales (an external platform is linked), visitor accounts, payments, search, analytics, contact forms. Not yet built: an embedded map, a text version of the program (`backlog.json` FB-3, FB-38).

## 3. Addresses

`<lang>` is `en` or `hu`. Every page exists in both.

| Address | Page |
|---|---|
| `/` | Sends the visitor to `/<lang>/` (R3) |
| `/<lang>/` | Community home (5.1) |
| `/<lang>/<address>/` | A community page made in the Studio; `festival` is reserved |
| `/<lang>/festival/` | Festival home (5.2) |
| `/<lang>/festival/<address>/` | A festival page made in the Studio, including Program, Teachers and Artists |
| `/404.html` | Page not found, in both languages |

- **R2.** All addresses end with a slash. The public site is plain files; nothing runs on a server.
- **R3. Root.** `/` goes to `/hu/` or `/en/` according to the first matching language in the browser's preferences, otherwise to the main language (Site settings). Without JavaScript it goes to the main language. The page also lists both languages as links.
- **P5.** A page is skipped with a warning when its address is missing or not lowercase letters, digits and hyphens, when it is reserved, or when another page in the same section already has it (the one earlier in menu order wins). A page's address is the same in both languages.

## 4. Every page

- **R4. Head.** `<title>` is "Page title | Section name" (section name alone on the two home pages; the section is the festival name or the community name). Meta description: the page's own, else the section's tagline in that language. Canonical URL. `hreflang` links to both languages and `x-default`. Open Graph title, description, URL, locale and image (the page's own photo, else the section's banner photo). `lang` attribute is the page's language.
- **R5. Indexing.** While "Hide the site from Google" (Site settings, `noindex`, on by default) is on, every page carries `robots: noindex, nofollow`.
- **R6. Skip link** to the main content is the first focusable element, in the page's language.
- **R7. Header** (stays at the top while scrolling): the brand, the menu, the language switch.
  - Brand: in the festival, the small festival logo (`headerLogo`; without it the big banner logo; the festival name as text when neither is uploaded), linking to the festival home. On the community level, the community logo (`communitySettings.logo`, else the round Forró Budapest logo `public/uploads/forro-budapest-logo.png`), linking to the community home.
  - Language switch: a drop-down showing the current language's flag, `EN`/`HU` and an arrow; it opens a list (flag and "English"/"Magyar") linking to the same page in each language, the current one marked. It works without JavaScript (`<details>`); with it, Escape or a click elsewhere closes it. On computers it sits between the menu and the Tickets button; on phones beside the menu button.
  - **P6. Menus.** Festival: Home (the festival home), then the festival pages with "Show in the menu" by menu order (shown with their menu label when set), then a "Tickets" button (new tab) when the ticket address is a safe link. Community: Home (the community home), then the community pages with "Show in the menu" and the button to the festival, by menu order. The festival button is a community page with "Menu button goes to: the festival home page" (`goesTo: "festival"`; no address or content of its own; its menu label or title, order and "Show in the menu" apply; only the first such page counts, with a warning); without one, a festival button with the festival name comes first.
  - Browser-tab icon, always as a PNG (Safari shows no WebP tab icons; a Sanity upload at most 192 px, a `/uploads/` path as the original file): on festival pages `festivalSettings.tabIcon`, else the big banner logo, else the small logo (none when no logo is uploaded); on community pages `communitySettings.tabIcon`, else the community logo.
  - From 1180 px (the one-row header) the festival's date line (the same as on the banner) is also shown next to the brand.
  - The current page has `aria-current="page"`.
  - Below 1180 px the menu is behind a button and opens as a full-screen panel; Escape closes it. From 1180 px everything sits in one row, in capitals. Without JavaScript the menu is always visible instead.
- **R8. Footer.** The community logo (as in the community top bar) and the community name in bold, together one link to the community home (no underline), then "© year"; contact email (`mailto:`), Instagram link shown as the Instagram icon (the festival's inside the festival, else the community's) and Facebook link when set, and the footer note. Each part is left out when empty. Stacked and centred on phones; in one row from 860 px (copyright left, the rest right). The footer is the way from the festival up to the community site.
- **R8a. Colours.** A palette (`src/lib/palette.ts`): built-in Festival red (`red`), Mustard (`gold`), Cream (`cream`, with the paper texture on festival pages), Light cream (`light`) and Dark (`dark`), each with a code and a text colour. Site settings → Colours (`siteSettings.colours`) can change a built-in colour's name, code and text colour and add colours (id `c` + the item's key). Page colours (`tone`), block backgrounds, the top bar (`festivalHeaderColour`, `communityHeaderColour`), the language list (`festivalLanguageListColour`, `communityLanguageListColour`; default: as the top bar) and the browser's scroll bar (`festivalScrollbarColour`, default Cream; `communityScrollbarColour`, default Light cream; the part you drag is that colour mixed with its text colour; see S25 for Safari) choose a colour id; the page carries the palette as CSS variables. An empty text colour becomes dark grey or cream, whichever reads better; a code that is not a colour code, text that reads poorly (under 3:1) or a colour id not in the palette is a warning. On community pages Festival red and Cream show as Mustard and Light cream. The text colour follows the background; there is no separate text colour setting. Buttons on a dark page or band of the community level are cream. The cream background on festival pages is the Wix paper texture (`src/styles/paper-cream.webp`), with text in the Wix dark grey `#2f2e2e`.
- **R8b. Fonts.** Four kinds of text, each a CSS variable in `global.css`: page titles (`--title`, the title band; Platypi), headings and large text (`--serif`; Fraunces), menu, buttons and bold labels (`--sans`; Libre Franklin) and body text (`--text`; Open Sans). Site settings → Fonts (`titleFont`, `headingFont`, `boldFont`, `textFont`) can each choose a font from the list in `src/lib/fonts.ts`; the page then overrides that variable. Empty or the usual font: nothing changes. An unknown id is a warning and the usual font is used. Sizes, weights and colours are not settable. All fonts are self-hosted; a browser downloads only those a page uses.

## 5. The two home pages

### 5.1 Community home (`/<lang>/`)

A headline banner: the headline (`title_*`, else the community name), an optional short line (`subtitle_*`) and up to two buttons (`heroButtons`: text and a page or address; the first solid, the second outlined). With a banner photo, all of it sits on the photo in cream; without one, on mustard with dark grey text and the big community logo beside it (above it on phones). Then the blocks from `communitySettings.homeBlocks`, on cream by default.

### 5.2 Festival home (`/<lang>/festival/`)

1. **Banner.** Banner photo (on phones the phone banner photo, when one is uploaded); over it, when one is uploaded, the banner video: muted, looping, loaded by a script only on screens 720 px and wider without "reduce motion" or data saver, faded in once it plays (the photo shows otherwise; a file that is not MP4 or WebM is left out with a warning); the big logo (or the festival name as text); the ticket button (needs a safe ticket address; label falls back to "Tickets"/"Jegyek"; new tab); the date line. Centred on phones; from 900 px the block sits to the left over the photo.
2. **Blocks** from `festivalSettings.homeBlocks` (the intro is a Large text block, the line of numbers a Statement text block, buttons to pages are Button blocks).

## 6. Pages and blocks

- **P7. A page.** Optional photo across the top. Then the big heading (else the page name): in a band of the page colour on red and dark pages, above the content on cream pages. Then the blocks. `<title>` uses the page name; the description and sharing photo come from the page.
- **P8. Bands.** Neighbouring blocks with the same background ("Same as page" counts as the page colour) and alignment share one band. A band directly after a band of the same colour has no top padding.
- **P9. Blocks.** Every block has a Content and a Style tab (background colour, alignment). A block of an unknown kind is skipped with a warning.

| Block | Shown as |
|---|---|
| Text | Rich text at reading width. Large: serif paragraphs as the festival intro. Statement: one bold line as the numbers line (plain text). Paragraphs are justified without hyphenation; centred and right-aligned blocks keep their alignment |
| Heading | h2, h3 or h4. Takes the width of the block under it (a gallery, banner, columns, video, calendar or wide image: the wide column; people: their grid; otherwise the text column) |
| Image | Wide (up to about 1150 px, at most 80% of the screen from 720 px), text width, or full screen width; caption below. Wide pictures one under the other touch, as on the Wix program page, and a page that starts with a picture sits close under its heading. An optional phone version replaces the picture under 720 px, in the page and in the photo viewer. Opens in the photo viewer; the viewer pages through all Image blocks of the page |
| Gallery | Layout `grid` (default): 2 columns, 3 from 720 px, photos cut to 4:3. Layout `mosaic`: from 720 px every five photos form the Wix Location-page pattern; 2 columns on phones. Every photo links to its large version and opens in the photo viewer (white, arrows, counter, swipe, arrow keys, Escape); without JavaScript the link opens the photo |
| Button | Leads to the chosen page in the visitor's language (label: its own, else the page's menu name), else to the address; left out with a warning when neither is usable |
| People | The chosen people in the chosen order; with none chosen, everyone in the group by display order (new entries start at 50 in the Studio; an empty order counts as 100), then name. See R22 |
| Banner | Photo with a dark veil (plum without photo), title, text, button |
| Columns | 2 to 4 side by side from 760 px, each with optional photo (4:3), heading, text |
| Event calendar | The block's months (each year, month, picture) from the current month on, one at a time: the month name ("2026. november" / "November 2026") between arrows, no arrow before the first or after the last month, the month's picture below (opens in the photo viewer); opens on the visitor's current month or the one in the address (`#2026-12`), and the arrows update the address. The browser also drops months that are over, since the site is only rebuilt on publish. Without JavaScript all months are listed with their names. No month: "No events planned yet". A month without a year, month or picture, or the same month twice, is skipped with a warning |
| Video | YouTube (through youtube-nocookie.com) or Vimeo (`dnt=1`) in a 16:9 frame, loaded lazily; any other address is left out with a warning |
| Divider | A line, or 2 rem of space |

- **R22. People cards.** A dark card: photo (cropped to 4:3 on phones, square from 860 px, with its alt text in the visitor's language), role (when set), name, bio paragraphs (an empty line starts one; a line with only invisible characters counts as empty), and the gold Instagram icon (new tab, read as "Instagram – name") when the link is safe. One card per row on phones, two side by side from 860 px. A person whose group is missing or unknown is shown with the teachers, with a warning.
- **P10. Links in rich text.** `https://`, `mailto:` and site addresses only; `javascript:` and the like are removed. A site address written without a language (`/festival/program/`) gets the visitor's language.
- **P11. Photos.** Uploaded photos come from `cdn.sanity.io` at 480, 960 and 1600 px wide (never wider than the original), with the editor's crop. When the design cuts a photo to a shape, the editor's focus point (hotspot) decides what stays visible. The description (alt text) is used in the visitor's language. Photos given as `/uploads/...` paths (the JSON files, the default community logo) are resized at build time (R11).

## 7. Content

- **P1.** The site is built from Sanity documents: `siteSettings`, `communitySettings`, `festivalSettings` (one each, fixed ids), `page` (with `section` festival or community) and `person` (group Teacher or Artist). The fields are defined in `studio/schemaTypes/`; that is the reference for what each document holds.
- **P2.** `CONTENT_SOURCE` chooses where they come from: `sanity` = the published documents in project `8hc671sk`, dataset `production` (what the test site uses); unset or `json` = the JSON files in `src/content`, converted by `src/lib/from-json.ts` (the default, for local work and tests); `file:<path>` = an `.ndjson` file of documents. Drafts (`drafts.*`) are never used in a build.
- **P3.** With `sanity`, a failed request, an authorisation error or a dataset with no festival settings and no pages **fails the build** on purpose, so the host keeps the previous site. Every other content problem is a `[content-warning]`.
- **P4. Import.** `npm run sanity:import-file` writes `sanity-import/data.ndjson` and copies the photos it uses to `sanity-import/images/`. Document ids are fixed (`person-<file name>`, `page-<file name>`, `page-program`, ...), contain no dots, and the file is identical on every run. `npm run sanity:import` imports it with `--missing`: only documents that do not exist yet are created; nothing is ever deleted. `npm run sanity:import-replace` overwrites the published documents in the file (drafts untouched); only for before the admin starts editing. A photo carries its upload instruction (`_sanityAsset`) on the photo object itself.
- **P24. JSON files to documents.** How the original JSON content maps (used for the import and the tests); `npm run check` [5] proves the site built from the import file is byte-identical to the one built from the JSON files.

| JSON | Sanity |
|---|---|
| `settings/site.json` | `siteSettings`, same fields |
| `settings/community.json` | `communitySettings`: title, banner photo; the intro becomes a Large text block in `homeBlocks` |
| `settings/festival.json` banner fields | `festivalSettings`: name, logos, banner photos, dates, ticket address and label, Instagram, tagline |
| `festival.json` intro, stats | `festivalSettings.homeBlocks`: a Large text block, a centred Statement text block |
| text pages with `showOnHome` | a centred Button block per page in `homeBlocks` |
| `programHeading`, `programImages`, `programText` | page `program` (order 1, red): heading, one wide Image block per image (alt "Program – name (n)"), a Text block |
| `teachersHeading`, `artistsHeading` | pages `teachers` and `artists` (order 2 and 3, red), each with one People block for its group |
| `pages/<name>.json` | page `<name>` (cream): title, menu label, cover photo, a Text block (Markdown converted to rich text), a Gallery block; order = 10 + its order |
| `people/<name>.json` | `person-<name>`, same fields |

- **R23. Fixed wording.** Menu words ("Home", "Tickets"), "Skip to content", the ticket-button fallback, "Instagram" and the 404 texts live in `src/lib/i18n.ts` in both languages, not in the Studio.

## 8. Rules

- **R9. Language fallback.** When one language of a two-language field is empty, the other is shown, per field.
- **R10. Links** are rendered only when they start with `https://`, `http://`, `mailto:` or a single `/`. Anything else (for example `javascript:`) is dropped, also inside rich text.
- **R11. Local photos.** At build time each JPG, PNG or WebP in `public/uploads/` gets WebP copies 480, 960 and 1600 px wide (never enlarged) in `public/_img/`. A photo that cannot be processed is served as it is, with a warning; a referenced photo that does not exist is left out, with a warning. Photos load lazily except banners and the first picture of a page.
- **R12. Tolerance.** Every field is optional in the code. Wrong types are converted (a number in a text field becomes text; "yes" or "true" counts as true; a single text where a list belongs becomes a one-item list). Only a malformed JSON file and P3 fail a build.
- **R13. Warnings never block publishing.** They are printed as `[content-warning]` lines in the build log.
- **R14. Ordering** is by `order` (empty counts as 100), then name or title.
- **R20.** The site works at any address: a custom domain or a sub-path, set by `SITE_URL` and `SITE_BASE`.
- **R21.** Dependency and Node versions are pinned.

## 9. Editor, preview and publishing

- **P12. Studio.** Hosted by Sanity at https://forro-budapest.sanity.studio (`studio/sanity.cli.ts`), deployed by GitHub when `studio/` changes on `main` (S19). Content menu: Festival (Home page, Pages, Teachers, Artists), Community (Home page, Pages), Everyone (teachers and artists), Site settings. The three settings documents cannot be created again, duplicated or deleted. New people and pages created from a list get that list's group or section.
- **P13.** English and Hungarian ("Magyar") fields side by side. Link fields accept `https://`, `mailto:` and `/` addresses. The page address must be lowercase letters, digits and hyphens and is generated from the English name without accents. Colour choices show the palette as swatches (S18).
- **P14. Hosted preview.** The click-to-edit preview runs on Cloudflare Workers (`forro-budapest-preview`, `npm run preview:build`, `wrangler.jsonc`). It shows drafts only to a browser the Studio has let in through `/preview/enable/` (a one-hour Studio secret, checked with Sanity; then a signed cookie for 12 hours); a wrong or missing secret gets 401 and no cookie; the entrance only leads to a path on the preview itself. Without the cookie it shows published content and a strip at the bottom saying drafts are hidden. Each request sees only its own content. Unknown first words in the address (not `en`/`hu`) get the 404 page.
- **P15. Publish rebuild.** The test site (`forro-bp-website`, `wrangler.site.jsonc`, static files from `CONTENT_SOURCE=sanity npm run build`) is rebuilt by a Sanity webhook calling the Worker's deploy hook when a published document of a site type is created, changed or deleted; drafts do not rebuild. A failed build deploys nothing, so the previous version stays online. Unknown addresses get the 404 page; `/en/festival` leads to `/en/festival/`. Every push to `main` also rebuilds both Workers.
- **P16. Admin acceptance.** The admin signs in herself, edits, publishes and confirms the result on phone and desktop before the site replaces Wix.
- **P17. Security and privacy.** Tokens only in provider secret stores, never in the repository or chat. No private care-team contact details in the repository or the dataset (the dataset is public).
- **P18. Preview mode.** `npm run preview:edit` (`PREVIEW=1`) serves the site at http://localhost:4322, rendering every page on request from the newest drafts in Sanity. It needs `SANITY_VIEWER_TOKEN` in the git-ignored `.env`. Drafts appear only after the Studio has opened the preview (the lock, P14); otherwise published content. Responses are `no-store` and `noindex`.
- **P19. Click targets.** Texts from fields ending in `_en`/`_hu` (including rich text) and names carry invisible markers; every photo has a `data-sanity` attribute. In the Studio's **Edit on the page**, hovering outlines them and a click opens that field, except on a link to another page of the site (menu items, buttons, the language switch): a plain click there goes to that page, and link texts are edited in the form (S26). Other values (tone, group, section, address, links, e-mail) never carry markers.
- **P20. After an edit** the preview page shows the draft without reloading: no white flash, the scroll position stays, the menu button still works. If the update fails, the page reloads. Nothing is published by editing.
- **P21. Edit on the page.** The tool shows the preview at `SANITY_STUDIO_PREVIEW_URL` (default http://localhost:4322; the deployed Studio takes it from `studio/.env.production`, and `npm run studio:deploy` refuses to deploy without an `https://` address), starting at the page of the document last open in the editor (a person: Teachers or Artists; Site settings: the page before; default `/en/festival/`) in the language the preview last showed, through the lock's entrance `/preview/enable/`. An address opens its document: `/<lang>/festival/` the festival home page, `/<lang>/festival/<address>/` that festival page, `/<lang>/` the community home page, `/<lang>/<address>/` that community page. Home pages and every page list where they appear on the site. People are edited by clicking them on the page that shows them.
- **P22. Public builds are untouched.** Without `PREVIEW=1` the build is static and identical to a build without the preview: no editing script (not even bundled), no `data-sanity` attributes, no markers, no drafts.
- **P23. Click-to-edit polish** (not built; `backlog.json` FB-5, FB-6, FB-7): links, e-mail and band colours clickable, fixed wording marked as not editable; the Studio's Published/Drafts switch honoured; people and Site settings list where they appear. Whole-block targets and drag to reorder were tried and parked (S27).

## 10. Non-functional requirements

- **Performance and privacy.** Outside requests only to Sanity (photos and the banner video) and, when a Video block is used, YouTube without cookies or Vimeo. Fonts are served from the site; no trackers and no cookies on the public site, so no consent banner.
- **Accessibility.** Semantic headings, skip link, visible keyboard focus, current-page and current-language markers, a labelled menu button with `aria-expanded`, link texts that name the person on Instagram links, reduced motion respected. Known gaps: the program is images, so its content is not available to screen readers unless a Text block is added; no formal audit.
- **Responsive.** Phone first; breakpoints at 720, 860, 900, 1180 and 1400 px. No horizontal scrolling from 320 px up.
- **Without JavaScript.** Everything works: the menu is shown open, the language list is a `<details>`, all calendar months are listed, photos open as plain images, `/` goes to the main language.
- **Design.** The festival follows the Wix festival site (red `#c80a2f`, cream with the paper texture, dark people cards, grey footer, torn-paper ticket buttons with live text). The community level uses the Forró Budapest palette: mustard `#c28f32` where the festival is red, light cream `#e9eadc`, dark grey text `#2e2e2e` (also on mustard, since cream on mustard is too faint), dark grey buttons with cream text; cream pages there are flat, without the texture. Community pages default to cream, with mustard for the header, the home banner and accents.

## 11. Acceptance criteria

A = automated by `npm run check` (section number in brackets). M = by hand (`HANDOFF.md`, "How to check things").

| # | Criterion | How | State |
|---|---|---|---|
| AC1 | The build passes on a clean install | A [1] | passes |
| AC2 | Every page exists in both languages | A [1] | passes |
| AC3 | Every person is on the page of their group, in both languages | A [1] | passes |
| AC4 | Language versions declare their language, link to each other, and the switch leads to the same page | A [1] | passes |
| AC5 | No `javascript:` link and no broken local link, image or srcset URL | A [1] | passes |
| AC6 | The `noindex` tag matches the setting | A [1] | passes |
| AC7 | No third-party font, script or tracker addresses in the output | A [1] [6] | passes |
| AC8 | Broken content (null and wrong-typed fields, missing photos, unsafe links, a reserved page name, an invalid main language, an oversized file) still builds, falls back, and logs warnings | A [2] | passes |
| AC9 | A missing translation falls back to the other language, both ways | A [2] | passes |
| AC10 | A malformed JSON file fails the build (known limit) | A [3] | passes |
| AC11 | With `SITE_BASE=/repo-name`, every link, photo, the root redirect and the sharing image carry the base path | A [4] | passes |
| AC12 | No horizontal scrolling from 320 to 1920 px in both languages; no console errors; the menu button opens the menu; `/` redirects by browser language and without JavaScript | M | checked for each visible change at 390 and 1280 px |
| AC16 | The admin confirms the look matches her design on phone and desktop | M | not done |
| AC17 | Every document the JSON conversion and the test content produce fits the Studio schema | A [0] | passes |
| AC18 | The import file has fixed, dot-free ids, all people, no un-uploaded photos, and is identical on every run | A [5] | passes |
| AC19 | The site built from the import file is identical to the site built from the JSON files | A [5] | passes |
| AC20 | Sanity-shaped content: crop and focus point, alt text, every block, language added to site links, unsafe links removed, drafts excluded, community pages and menus, the warnings in P5 and P9, only `cdn.sanity.io` and `youtube-nocookie.com` as outside sources | A [6] | passes |
| AC22 | Studio builds and the schema validates | A (`npm run studio:build`, `npx sanity schema validate`) | passes |
| AC23 | An invited editor can sign in, on a phone too | M | not done (FB-11) |
| AC26 | Public builds carry no click-to-edit parts (P22); the import file puts upload instructions on the photo | A [5] [6] [7] | passes |
| AC29 | Hosted preview: lock (wrong, missing, forged and expired secrets or cookies show no drafts), parallel requests, every page, 404s, update without reload, link clicks in Edit on the page | A [8] | passes |
| AC30 | On the real setup: Edit on the page shows drafts only inside the Studio, updates without reload; Publish rebuilds the test site | M | done 2026-11-23 (Dávid, Safari) |
| AC31 | P16: the admin's own trial | M | not done (FB-16) |
