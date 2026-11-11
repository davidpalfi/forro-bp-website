# Specification

What the site does and how it must behave. This describes the prototype as built. Where the real site's content or design is still undecided, the spec says so. Requirement IDs (R1, R2, ...) are referred to in the acceptance criteria at the end.

## 1. Purpose and users

A public website for a dance festival, replacing an existing Wix site, with content the festival's admin edits herself.

| User | Main tasks |
|---|---|
| Visitor (mostly on a phone, arriving from a social media link) | See when and where the festival is; see the program; see who teaches and performs; buy tickets; find the location and rules; open promo videos and photos |
| Admin (non-technical, also a designer) | Add or change program items, people, links and text pages; replace photos; change home page texts. Without a developer, in a few minutes |
| Maintainer (developer, or an AI agent working for one) | Change the structure, fix problems, deploy |

## 2. Scope

In scope: public pages listed in section 3, the content model in section 5, editing through forms, building and hosting as a static site.

Out of scope for the prototype (see section 10): a second language, ticket sales (tickets are sold on an external platform and linked), accounts or logins for visitors, payments, search, calendar export, analytics, contact forms.

## 3. Pages and addresses

| Address | Page | Source |
|---|---|---|
| `/` | Home | `settings/home.json`, `site.json`, events, people, links |
| `/program/` | Program | events, people |
| `/people/` | People | people |
| `/<name>/` | Text page, one per file in `src/content/pages/` | the Markdown file |
| `/404.html` | Page not found | fixed text |

**R1.** The addresses `program`, `people`, `404` and `uploads` are reserved. A text page with one of these file names is skipped with a `[content-warning]` in the build log.
**R2.** All addresses end with a slash (`trailingSlash: 'always'`).
**R3.** The whole site is plain files; there is no server-side code at runtime.

## 4. Page behavior

### 4.1 Every page (layout)

- **R4. Head.** `<title>` is "Page title | Site name" (just the site name on the home page). Meta description is the page's own, else the site tagline (omitted when empty). Canonical URL, Open Graph title, description, type and URL. Theme colour. `lang` is the first part of `locale`.
- **R5. Indexing.** When `noindex` in `site.json` is true (the default), every page carries `robots: noindex, nofollow`.
- **R6. Skip link** to the main content is the first focusable element.
- **R7. Header.** Site name (link to `/`), then the menu: Home, Program, People, then text pages with `showInMenu` true, ordered by `order` then title. The current page has `aria-current="page"`. A ticket button (opens in a new tab) is shown last, only when `ticketUrl` is a safe link and `ticketLabel` is not empty.
- **R8. Footer.** Site name, email (as a `mailto:` link), Instagram and Facebook links (only those with a safe link), and the footer note. Each part is left out when empty.
- **R9. Past items hide.** A small inline script hides every element carrying `data-day` earlier than the visitor's local date, hides day groups that become empty, and shows the "no events" message when nothing is left. Without JavaScript, nothing is hidden.

### 4.2 Home (`/`)

In this order; a section with no content is left out entirely unless stated.

1. **Hero.** Big title (`heroTitle`, else the site name); `dateLine`; `heroSubtitle`; a button (`ctaLabel` + safe `ctaUrl`, both needed; opens in a new tab); the main photo (`heroImage`; loads eagerly; decorative, so empty alt text).
2. **Intro.** `intro` text; each blank-line-separated block is a paragraph.
3. **Coming up** (heading `eventsHeading`, default "Coming up"). The first 6 events whose date is today or later, by the date at build time, each as a program row with a date block (4.4). When none exist at build time the "no events" message is shown. A link to the program page is shown when any event exists at build time.
4. **People** (heading `peopleHeading`, default "Meet the people"). People with `featured` true, at most 8, in people order, plus a link to the people page. Left out when nobody is featured.
5. **Links** (heading `linksHeading`, default "Watch and look"). Each link as a card; left out when there are no usable links.

### 4.3 Program (`/program/`)

- **R10.** Heading is the "Program" label. Events are grouped by date; each group has a heading with the long weekday, day and month in the site's locale (capitalised by CSS).
- **R11.** Within a day: ordered by start time (text comparison, so use 24-hour times), then title. Rows show the start time on the left (see 4.4).
- **R12.** Past events are in the HTML but hidden by R9. When the program is empty (or everything is hidden) the "no events" message is shown.

### 4.4 Program row

- Title, with the type as a small badge when set.
- Meta line. On the home page (date block variant): weekday, time range ("20:00 – 22:30", or only the start time), place. On the program page (time variant): place only; the start time is shown on the left.
- People names, joined with ", ", for each referenced person that still exists.
- Description, with line breaks kept.
- A link (opens in a new tab) with the "details" label when `url` is a safe link.

### 4.5 People (`/people/`)

- **R13.** Groups in this order: Teachers, Performers, Organizers (people whose role matches `teacher`, `performer` or `organizer`, ignoring case), then "More people" for any other or empty role. Empty groups are left out.
- **R14.** Within a group: ordered by `order` (default 100), then name.
- **R15.** Card: photo cropped to 4:5 (a plain placeholder box when there is no photo), name, country, bio, and the link shown as its host name (opens in a new tab).

### 4.6 Text pages (`/<name>/`)

Title as heading, optional photo, then the Markdown body (headings, lists, links, bold and italic as standard Markdown).

### 4.7 Page not found

A short message and a link to the home page.

## 5. Content model

All content is plain files under `src/content/`. In the tables: **Form** = what the editing form enforces (`.pages.yml`). **Code** = what the site does when the value is missing or odd. The code never fails on a missing or wrong-typed value (R20).

### 5.1 `settings/site.json` (one file)

| Field | Type | Form | Code and use |
|---|---|---|---|
| `name` | text | required | Default "Festival". Header, footer, title |
| `tagline` | text | | Fallback meta description |
| `locale` | select `en-GB` or `hu-HU` | | Language for dates and the `lang` attribute. Default `en-GB`. Code accepts any valid language tag |
| `email` | text | | Footer `mailto:` link |
| `instagram`, `facebook` | link | https only | Footer links |
| `ticketLabel`, `ticketUrl` | text, link | https only | Header button; needs both |
| `footerNote` | text | | Small text in the footer |
| `noindex` | yes/no | default yes | See R5 |
| `labels.home`, `.program`, `.people` | text | | Menu and page headings. Defaults: Home, Program, People |
| `labels.details` | text | | Link text on program rows. Default "Details" |
| `labels.noEvents` | text | | Default "The program will be announced soon." |
| `labels.teachers`, `.performers`, `.organizers`, `.others` | text | | People page headings. Defaults: Teachers, Performers, Organizers, More people |

### 5.2 `settings/home.json` (one file)

`heroTitle`, `dateLine`, `heroSubtitle`, `heroImage` (photo), `ctaLabel`, `ctaUrl` (https only), `intro` (multi-line text), `eventsHeading`, `peopleHeading`, `linksHeading`. All optional; headings default as in 4.2. See 4.2 for how each is used.

### 5.3 `events/*.json` (one file per program item)

| Field | Type | Form | Code and use |
|---|---|---|---|
| `title` | text | required | Falls back to the file name |
| `date` | `yyyy-MM-dd` | required | An empty, malformed or impossible date (for example `2027-13-45`) skips the event with a warning |
| `startTime`, `endTime` | text, 24-hour | | Shown as written; start time is also used for ordering |
| `place` | text | | |
| `type` | select Workshop, Concert, Party, Social, Other | | Shown as written, any text accepted |
| `people` | list of references to people | | Resolved by file name; missing people ignored; a single string counts as a one-item list |
| `description` | multi-line text | | Line breaks kept |
| `url` | link | https only | Unsafe or empty: no link |

File name convention: `yyyy-MM-dd-title-in-lowercase.json` (the editor generates it from the date and title).

### 5.4 `people/*.json`

| Field | Type | Form | Code and use |
|---|---|---|---|
| `name` | text | required | Falls back to the file name |
| `role` | select Teacher, Performer, Organizer | required | Groups the people page (R13) |
| `photo` | photo path | JPG, PNG or WebP | Missing file: no photo shown, with a warning |
| `country`, `bio`, `link` | text, text, link | link: https only | |
| `featured` | yes/no | default no | Shows on the home page |
| `order` | number | | Default 100; lower first |

### 5.5 `links/*.json`

| Field | Type | Form | Code and use |
|---|---|---|---|
| `label` | text | required | Falls back to the URL |
| `url` | link | required, https only | Unsafe or empty: the link is dropped |
| `kind` | select Video, Photos, Social, Tickets, Other | | `video` and `photos` give the card a different accent colour |
| `description` | text | | Shown under the label; falls back to the kind |
| `order` | number | | Default 100; lower first |

### 5.6 `pages/*.md` (Markdown with front matter)

| Field | Type | Form | Code and use |
|---|---|---|---|
| `title` | text | required | Falls back to the file name |
| `menuLabel` | text | | Menu text; falls back to the title |
| `showInMenu` | yes/no | default yes | |
| `order` | number | | Default 100; lower first |
| `image` | photo path | | Shown above the text |
| body | rich text | | Markdown |

### 5.7 Photos

Stored in `public/uploads/`; content refers to them as `/uploads/<file>`.

## 6. Rules and calculations

- **R16. Dates** are treated as plain calendar days, with no time zone, so a day can never shift. They are formatted in the site's `locale`.
- **R17. "Today"** is the date at build time (UTC) for the home page's list, and the visitor's local date for hiding (R9). Around midnight these can differ by a day; the home list may keep a just-past event until the next build, and the browser removes it.
- **R18. Links** are rendered only when they start with `https://`, `http://`, `mailto:` or a single `/`. Anything else (for example `javascript:`) is dropped.
- **R19. Photos.** At build time each JPG, PNG or WebP in `public/uploads/` gets WebP copies 480, 960 and 1600 px wide (never enlarged; the largest is the original width, capped at 1600). Pages use them with `srcset` and the original's width and height, so the layout does not jump. Phone rotation tags are respected. A photo that cannot be processed is served as it is. A referenced photo that does not exist is left out. Photos are lazy-loaded except the home page's main photo.
- **R20. Tolerance.** Wrong types are converted (a number in a text field becomes text; "yes" or "true" counts as true; a text where a number belongs is ignored). Only unreadable file syntax (for example broken JSON) fails a build.
- **R21. Ordering** by `order` (default 100) then name, title or label, using locale-aware comparison. Events are the exception (R11).

## 7. Editing experience

- **R22.** Everything the admin can change is available as a form with plain labels and short hints (`.pages.yml`): Home page, Text pages, Program, People, Videos/photos/social links, Site settings.
- **R23.** Required fields (title, date, name, role, link) cannot be left empty in the form. Link fields must start with `https://`. Dates are picked from a calendar.
- **R24.** Photos can be uploaded in any size, in JPG, PNG or WebP.
- **R25.** Teachers and performers are picked from a list when editing a program item.
- **R26.** A saved change is live within a couple of minutes (target, not yet measured).
- **R27.** The admin cannot change layout, colours or code through the forms.
- **R28.** The site works at any address: a custom domain (base `/`) or a sub-path such as `name.github.io/repo-name/`. The address comes from the environment variables `SITE_URL` and `SITE_BASE`; every internal link, photo and Markdown link/image carries the base path.
- **R29.** Every push to `main` runs `npm run check` and the build; the site is published only if both pass, otherwise the previous version stays online. Content warnings from the build are shown on the run's summary page.
- **R30.** Dependency and Node versions are pinned (exact versions in `package.json`, lockfile, `.node-version`), so the same input gives the same site.

## 8. Non-functional requirements

- **Performance.** No requests to third parties (no external fonts, scripts, trackers or embeds). Responsive photos (R19). The pages are static files.
- **Privacy.** No cookies and no third-party requests, so no consent banner is needed for the prototype. Adding analytics or embeds changes this.
- **Accessibility.** Semantic headings, a skip link, visible keyboard focus, a current-page marker in the menu, reduced-motion respected (the site has no animation), buttons and links sized for touch (not formally measured). Photos are decorative (empty alt text). Known gap: editors cannot supply alt text.
- **Responsive.** Mobile first; one breakpoint at 720 px. No horizontal scrolling at 390 px wide.
- **Browsers.** Current browsers. The site works without JavaScript (all program items stay visible).
- **Robustness.** Bad content must not take the site down (R20, section 6). If a build fails, the host keeps serving the previous version (to be confirmed on the host).
- **Independence.** Content and code are plain files in a Git repository; hosting and editing tools can be replaced without changing the site.
- **Build.** `npm run build`, output folder `dist/`, needs Node 22.23.4 (pinned in `.node-version`; `engines` allows newer).

## 9. Acceptance criteria

Automated by `npm run check` (A) or checked by hand (M). See `docs/HANDOFF.md` for how to do the manual ones.

| # | Criterion | How |
|---|---|---|
| AC1 | The build passes on a clean install | A |
| AC2 | Home, program, people, 404 and every text page exist in the output | A |
| AC3 | Every dated event is on the program page; every person is on the people page | A |
| AC4 | No `javascript:` link and no broken local link, image or srcset URL in the output | A |
| AC5 | The `noindex` tag matches the setting | A |
| AC6 | Broken content (no date, impossible date, wrong types, deleted references, missing photos, unsafe links, reserved page name, empty settings) still builds, is skipped or falls back, and logs a `[content-warning]` where something was skipped | A |
| AC7 | A text page named like a built-in address does not replace the built-in page | A |
| AC8 | A malformed JSON file fails the build (known limit) | A |
| AC9 | Past events are hidden with JavaScript on and visible with it off | M |
| AC10 | No horizontal scrolling and no console errors at 390 px and 1280 px wide | M |
| AC11 | An oversized phone photo is resized and shown with the right orientation | M (done once, 2026-11-11) |
| AC12 | All five editing sections appear in Pages CMS with the described fields | M, not yet done |
| AC13 | An invited editor without a GitHub account can sign in, add a program item with a teacher and a photo, and see it live | M, not yet done |
| AC14 | A failed build leaves the previous site live | M, not yet done (on GitHub Pages: the deploy job only runs if check and build pass; confirm on the first failed run) |
| AC15 | With `SITE_BASE=/repo-name`, no link, photo or srcset URL ignores the base path, and Markdown links/images are rewritten | A (`npm run check`, section 4); also clicked through in a browser once |
| AC16 | An oversized or unreadable photo produces a `[content-warning]` line | A |
| AC17 | The GitHub workflow publishes the site on push to `main` | M, not yet done (needs a real repository) |

## 10. Not specified yet (needs a decision)

- Content: the real page list, the real content types, and any pages beyond those above.
- Languages: whether the site needs a second language (this roughly doubles the content to edit).
- Design: the admin's own design replaces the styles and markup, not the content model.
- Analytics, a sitemap, contact or sign-up forms, calendar export, search, photo alt text fields.
- Hosting details: custom domain, build-failure notifications, preview deployments for edits.
