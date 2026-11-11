# Specification

What the site does and how it must behave, as built on 2026-11-11. Requirement IDs (R1, R2, ...) are referred to in the acceptance criteria at the end. For why, see `DECISIONS.md`.

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
  - Brand: in the festival, the festival logo (or its name as text when no logo is uploaded), linking to the festival home. On the community level, the community name, linking to the community home.
  - Language switch: `EN` and `HU`; each links to the same page in that language; the current one is marked.
  - Festival menu, in order: Home (the festival home), Program, Teachers, Artists, text pages with `showInMenu` (by `order`, then title; shown with their `menuLabel` when set), the community name (link up to the community home), and a cream "Tickets" button (new tab) when `ticketUrl` is a safe link. Community menu: one link to the festival.
  - From 1400 px the festival's date line is also shown next to the brand.
  - The current page has `aria-current="page"`.
  - Below 1180 px the menu is behind a button and opens as a full-screen panel; Escape closes it. From 1180 px everything sits in one row, in capitals. Without JavaScript the menu is always visible instead.
- **R8. Footer.** "© year community name", contact email (`mailto:`), Instagram link (the festival's inside the festival, else the community's) and Facebook link when set, and the footer note. Each part is left out when empty. Stacked and centred on phones; in one row from 860 px (copyright left, the rest right).
- **R8a. Page background.** Red on the home pages, program, teachers, artists and 404; cream with dark text on text pages.

### 4.2 Community home (`/<lang>/`)

Banner with the community title over the banner photo; the intro paragraphs when written; then the festival name, its date line and a button to the festival. Nothing else yet.

### 4.3 Festival home

1. **Banner.** Banner photo (on phones the phone banner photo, when one is uploaded); the logo (or festival name as text); the ticket button (needs a safe `ticketUrl`; label falls back to "Tickets"/"Jegyek"; new tab); the date line. Centred on phones; from 900 px the block sits to the left over the photo.
2. **Intro.** Each blank-line-separated block is a paragraph. Left out when empty.
3. **Closing block.** The line of numbers (`stats`); one button per text page with `showOnHome`; the ticket link again.

### 4.4 Program

Heading (`programHeading`, else "Program"). The `programImages` in order, one under the other at up to about 1150 px wide, the same in both languages. Then `programText` when written. Image alt text is "Program – festival name (n)".

### 4.5 Teachers and Artists

Heading (`teachersHeading` / `artistsHeading`, else the menu word). Then each person of that group, by `order` (default 100) then name, as a dark card on the red page: photo (cropped to 4:3 on phones, square from 860 px), role (when set), name, bio paragraphs, and an "Instagram" link (new tab) at the bottom of the card when the link is safe. One card per row on phones, two side by side from 860 px. A person whose group is missing or unknown is shown with the teachers, with a warning.

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
| `logo` | image | Banner and header; text is used when empty |
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
| `bio_*` | multi-line | Paragraphs |
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
- **Design.** Colours, shapes and layout follow the Wix festival site (red, cream, dark inner pages, grey footer, torn-paper ticket button). Deliberate differences: body text is left-aligned, not justified; the language switch is two links, not a flag drop-down; Instagram is a text link, not an icon; the menu has one extra entry, the link up to the community home.

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
