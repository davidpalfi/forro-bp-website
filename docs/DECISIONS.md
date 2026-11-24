# Decision log

Why the site is built the way it is. Read this before changing the structure. When you add or change a decision, update this file in the same commit. Keep entries short: what was decided, why, what else was considered, and what would make us revisit it. Numbers are stable (code, commits and other documents refer to them); a replaced decision keeps its number under "Superseded".

Open questions are not kept here: they are `decision` tickets in `backlog.json`.

## Context and priorities

The Forró Budapest community wants one website. Before this project it had only a festival site on Wix (forrobudapest.com, Budapest Forró Festival). The plan: a community site, with the festival one level below (`/festival/`); the festival keeps the look of the Wix site, which the admin designed; English and Hungarian from the start.

Priorities, in order:

1. **The admin can update content herself.** She is not technical. She is a designer and made the Wix design.
2. **No subscription and no paid accounts.** Leaving Wix is about cutting the subscription. Content may live with a provider if its free plan covers the need (changed 2026-11-15; before, content had to stay in the repository).
3. **Robust and hard to break.**
4. A developer maintains it, with a few technical people in the community as backup. **Claude is a tool for the maintainer only, not an editing path for the admin**: it would need a paid plan and a GitHub account.

The needs behind these, and how well each is known, are in `USER-NEEDS.md`.

## Foundations (from the first version, still in force)

### 1. A static public site
The public site is plain files: nothing to patch, free hosting, fast. Rejected: WordPress (paid hosting, security updates). Amended: the click-to-edit preview renders on request (S9, S11), but only the preview. Revisit if the site needs logins, payments or bookings.

### 2. Astro
Pre-rendered HTML, widely supported. Cost: a build step. Astro 7 needs Node 22.23.4 or newer; `.node-version` pins it.

### 4. One site, two levels: community above, festival below
`/<lang>/` is the community home, `/<lang>/festival/...` the festival. Why: the admin and owner agreed the festival moves under a community site. Considered: two separate sites (two things to maintain). The community level was an empty shell at first; it now has its own palette, home banner, menu and event calendar (S14-S17).

### 5. Two languages, in the address, side by side in each entry
Every page exists at `/en/...` and `/hu/...`; `/` sends the visitor to Hungarian if the browser prefers it, else to the main language. Each entry holds both languages side by side (`bio_en`, `bio_hu`); things that are the same in both (name, photo, links) are entered once; an empty language shows the other. Short fixed wording lives in `src/lib/i18n.ts`. Why: she writes both languages herself, sees at once what is missing, and cannot end up with a person in one language only. Considered: a separate entry per language (photos and links twice; the two drift apart). Confirmed for Sanity as S1. Revisit if a third language is needed.

### 8. The code is lenient, and warnings never block publishing
Every field is optional in the code; empty or wrong-typed values are converted or fall back (`src/lib/schema.ts`). "Required" is enforced only in the Studio. Content problems are `[content-warning]` lines in the build log and **do not stop the deployment**. Why: if publishing stopped, the admin would see nothing happen and not know why, and every later edit would be stuck too. The only deliberate failures are a malformed JSON file and an unreachable or empty Sanity (`SPEC.md` P3), so the host keeps the previous site.

### 10. Fonts are self-hosted; outside requests kept to a minimum
Fonts are npm packages (`@fontsource-variable/...`) served from the site. No external fonts, scripts, trackers or cookies, so no consent banner. Exceptions: Sanity's photos and banner video (S4, S21) and, only where a Video block is used, YouTube without cookies or Vimeo (S5). Page titles use Platypi, the Wix font (S22); the other fonts are a match by eye until the admin confirms them.

### 11. Link safety
Only `https://`, `http://`, `mailto:` and site-relative links are rendered (`safeUrl`). The Studio also checks links.

### 12. The site hides itself from Google until launch
"Hide the site from Google" in Site settings (`noindex`) is on by default. Turn it off at launch, only when Dávid approves.

### 15. Pinned versions
All dependencies are exact versions, `package-lock.json` is committed, installs use `npm ci`, `.node-version` is exact. Upgrade deliberately (`ARCHITECTURE.md`). Node 22 leaves maintenance in spring 2027 (`backlog.json` FB-43).

### 16. Base path from environment variables
`base` in `astro.config.mjs` comes from `SITE_BASE`, the address from `SITE_URL`. Every internal address goes through `withBase()` or `href()`.

## Sanity decisions

### S1. Languages side by side in each entry (Dávid, 2026-11-16)
Decision 5, kept for Sanity. Dávid: "we change later if it's not good".

### S2. A full page builder (Dávid, 2026-11-16)
Chosen because the exact pages and layouts are not known yet, so the admin should have the most freedom a block system can give.
- The admin can **create new pages** herself and add them to the menu.
- **Every page is a list of blocks** she adds, removes and reorders: heading, text, image, gallery, button, banner, columns, video, divider, people, event calendar.
- **Teachers and artists are reusable entries** placed with a People block, so a person is entered once and the cards stay consistent.
- **Each block has a few style options** from the design (background colour, alignment).

Limits, stated to Dávid: her freedom is within the blocks that exist; no free positioning as in Wix; a new kind of block is a code change. Do not guess further blocks; add them when the admin's drawings arrive. Considered: fixed fields everywhere (as in the proof of concept); blocks only on some pages; blocks everywhere without reusable people (inconsistent cards).

### S3. Sanity Studio hosted by Sanity (Dávid, 2026-11-16)
The admin opens `forro-budapest.sanity.studio`. Free, nothing to maintain, the site stays simpler. Considered: the Studio embedded in the site at `/admin` (ties the editor to the site's hosting). Sanity was chosen over TinaCMS (visual editing on Astro experimental) and Storyblok (free tier too small) after Pages CMS forms proved unintuitive for her.

### S4. Photos from Sanity's image service (Dávid, 2026-11-16)
The admin uploads, crops and sets the focus point in the editor; Sanity resizes; visitors load photos from Sanity. Simpler, and better for her. Cost: photos depend on Sanity's free plan. Considered: downloading and resizing at build time (more code, less cropping convenience); it can be switched to later without the admin noticing.

### S5. Content model refinements (2026-11-17)
- **Program, Teachers and Artists are ordinary pages** made of blocks; nothing is reserved under `/festival/`. A People block with no one picked shows everyone in its group, so a new teacher appears without touching the page.
- **The two home pages hold their blocks themselves** (`homeBlocks`), instead of pointing at a page document that must not be deleted.
- **Pages have a colour, an optional big heading and an optional top photo**, which reproduce the old red and cream pages.
- **Text blocks have a style (Normal, Large, Statement)** for the festival intro and the numbers line. **Buttons link to a chosen page** or an address. **Images** can be wide, text width or full width; **columns** can have a photo.
- **Video** embeds YouTube through youtube-nocookie.com and Vimeo with `dnt=1`, loaded only when the block is used.

Revisit when the admin has tried it.

### S6. One rendering path; the JSON files become Sanity documents (2026-11-17)
The site only knows Sanity documents. The JSON files in `src/content` are converted to the same documents (`src/lib/from-json.ts`), and the same conversion writes the import file. Why: the test suite tests the Sanity rendering and the migration mapping at once, and proves the import file and the JSON files give an identical site. `CONTENT_SOURCE` picks the source (`SPEC.md` P2). Considered: a separate Sanity-only code path (two renderers to keep in step). Markdown from the old files becomes Sanity rich text; an image inside Markdown text is not supported (use an Image block).

### S7. Migration by import file, run by Dávid (2026-11-17)
`npm run sanity:import` imports with `--missing`: only documents not in Sanity yet are created, so a repeat never overwrites the admin's work, and nothing is deleted. Ids are fixed and contain no dots (Sanity hides dotted ids from public reads). Why an import file and not a script with a write token: no token is needed anywhere but Dávid's signed-in computer, and the file can be read before it is sent. `--replace` resets documents to the JSON content; only before the admin starts.

### S8. Click-to-edit before hosting (Dávid, 2026-11-18)
After seeing the Sanity forms, Dávid found them still "just forms", like Pages CMS (`USER-NEEDS.md` N9). So click-to-edit was built first, on his computer, as the cheapest test of whether Sanity solves the problem. **Outcome the same evening:** he clicked texts and photos, edited, and made a community page unaided: "works pretty awesome". Sanity stays. Click-to-edit is a computer workflow; on a phone she uses the forms.

### S9. How click-to-edit is built (2026-11-18)
- **A separate preview mode, not a change to the public build.** Only with `PREVIEW=1` is `astro.config.mjs` switched to on-request rendering, the `.env` file read and the editing script added. `npm run check` [6] [7] proves public builds carry none of it. Locally it runs on Astro's dev server at port 4322 (Astro 7 otherwise reuses a running `npm run dev` without telling).
- **Fresh drafts on every request**, loaded by `src/middleware.ts` (drafts over published) and handed to `content.ts`; pages are unchanged. The two page routes look their page up by address instead of taking it from `getStaticPaths`.
- **How a click finds its field.** Texts carry Sanity's invisible "stega" markers (`@sanity/client`). Only fields ending in `_en`/`_hu` (and their rich text) and names get markers; values the code compares or uses as addresses (tone, group, section, slug, links, e-mail) never do, or the site would break. Photos cannot carry markers, so in preview each `<img>` gets a `data-sanity` attribute.
- **The editing script** is `@sanity/visual-editing`, bundled and served by the preview itself, added by a small integration in `astro.config.mjs` that exists only in preview (in `Base.astro`, even behind a condition, the public build bundled it).
- **Studio:** "Edit on the page" (Presentation) next to "Content", which stays first so the Studio opens on the familiar lists. Its address comes from `SANITY_STUDIO_PREVIEW_URL`.

### S10. Sanity Free plan; the admin is an Administrator (Dávid, 2026-11-18)
Stay on the **Free plan**. The admin gets the **Administrator** role; Dávid stays Administrator too, so either can recover access. On Free the only roles are Administrator and Viewer (Editor starts on Growth, about $15 per seat per month), and she owns the site, so full rights are right; mistakes are undone with the document history. Free, per Dávid's screenshot of the plan page on 2026-11-18: up to 20 seats, 2 roles, 2 datasets (public only), live previews and visual editing. So: build only on what Free offers, and keep private details out of content (published content is readable by anyone; drafts are not). The organization was on a Growth trial that downgrades to Free by itself; the webhook is checked on Free after it ends (`backlog.json` FB-15). Later: possibly move ownership of the Sanity organization to her.

### S11. Preview and test site on Cloudflare Workers; the preview lock (2026-11-18; lock and no-reload chosen by Dávid)
- **Both on Cloudflare Workers, free plan**, built by Workers Builds from `main`: `forro-budapest-preview` (`wrangler.jsonc`, `npm run preview:build`, the `@astrojs/cloudflare` adapter, on-request rendering) and `forro-bp-website` (`wrangler.site.jsonc`, the static build with `CONTENT_SOURCE=sanity`). Setup: `HOSTING.md`. Why Workers: the installed adapter supports only Workers; one product for both; Workers Builds has deploy hooks. Free plan (checked 2026-11-18): 3,000 build minutes a month, 1 build at a time, 100,000 requests a day. Considered: Cloudflare Pages for the test site (a second product); GitHub Pages (no deploy hook a Sanity webhook can call without a token).
- **No file reads in the preview**: content comes only from Sanity. `SANITY_VIEWER_TOKEN` is a Cloudflare secret; `SANITY_STUDIO_URL` is in `wrangler.jsonc`.
- **One content set per request.** One Worker serves several requests at once, some with drafts and some without, so each request renders inside `withDocuments()` (AsyncLocalStorage) with its own documents. Tested with 16 mixed requests at once (`npm run check` [8]).
- **The preview lock** (`src/lib/preview-lock.ts`): the Studio opens `/preview/enable/` with a one-hour secret it stores in the dataset; the preview checks it with Sanity and sets a cookie signed with a key derived from the token, valid 12 hours, `HttpOnly; SameSite=None; Secure; Partitioned` (Safari drops cross-site cookies in frames without `Partitioned`). Without it the preview shows only published content and a strip saying drafts are hidden. Considered: Cloudflare Access (another login for the admin); a secret in the address (leaks when copied). Risk: a browser that blocks even partitioned cookies sees no drafts in the frame; workaround "Open preview" in a new tab.
- **No reload after an edit** (polish A): the page is fetched in the background and the content of `<body>` swapped, keeping Sanity's overlay and the scroll position; any error falls back to a reload. Not letter by letter (Sanity saves after a pause).
- **The Studio** gets the preview's address from `studio/.env.production`; `npm run studio:deploy` refuses to deploy without an `https://` address there, so the admin never gets a tab pointing at `localhost`.
- **Verified 2026-11-23 by Dávid** on the real setup: Workers Builds, Publish rebuilding the test site, and the lock in Safari (drafts inside the Studio, the strip outside).

### S12. Sanity is the site; `main` carries it (Dávid, 2026-11-23)
`feature/sanity` was merged into `main`, which both Workers build. The Pages CMS proof of concept is retired: its GitHub Pages workflow and forms were removed, and its last state is the tag `pages-cms-poc`. The JSON files in `src/content` stay as the import source and test content.

### S13. Closer to the Wix look; code pushed straight to `main` (Dávid, 2026-11-23)
Dávid compared the test site with the Wix site in the same window and asked for: the Wix red (`#c80a2f`); text, banner logo, button and date at about the Wix sizes; the date in the top bar; a separate small logo for the top bar; the language switch as a flag drop-down between the menu and the Tickets button; the Wix torn-paper ticket buttons; the Instagram icon in the footer; justified paragraphs without hyphenation; no second ticket link at the bottom of the festival home; the Wix paper texture behind cream pages with text in the Wix dark grey; for galleries a Mosaic layout and a full-screen photo viewer (own inline script). The ticket buttons use the Wix button images with the words taken out (`src/styles/ticket-*.png`), so the label stays live text: translated, editable and readable by screen readers. The flags and the Instagram icon are Dávid's PNGs in `public/icons/`. Also: code changes are pushed straight to `main` once `npm run check` passes, and reverted if something breaks.

### S14. The community level has its own palette (Dávid, 2026-11-23)
Community pages use the Forró Budapest palette from the community's Instagram: mustard (`#c28f32`, measured from the round logo) instead of the festival red, light cream (`#e9eadc`), dark grey text (`#2e2e2e`) and dark grey buttons with cream text (blue and cream buttons tried and dropped the same day). Text on mustard is dark: cream on mustard measures 2.4:1. Done with CSS variables scoped to `.in-community`, so every component follows without changes.

### S15. Event calendar: one picture per month, inside the block (Dávid, 2026-11-23)
An "Event calendar" block holds the months (year, month, picture) and shows them one at a time with arrows, opening on the current month; past months disappear by themselves (at build time and again in the browser, since the site is only rebuilt on publish). The months live inside the block, where the editor already is: a first version kept them as separate documents in their own Studio list, which nobody would find. The calendar is a picture (as on Instagram). Chosen over a hover drop-down (no hover on phones) and a full calendar. The preview's update-without-reload does not rerun the script, so while editing all months are listed until the page is reloaded.

### S16. The community menu's festival button is a page entry (Dávid, 2026-11-24)
A community page can be set to "Menu button goes to: the festival home page". It then has no address or content of its own and appears in the community menu with its title or menu label, order and "Show in the menu". So the festival button is ordered and renamed in the same place as every other menu button. Without such a page a festival button comes first, so the community menu never loses its way to the festival.

### S17. Community home: a headline banner (Dávid, 2026-11-24)
The community home starts with a headline that says what Forró Budapest is, a short line and up to two buttons, instead of a banner with only the name (already in the logo). Without a photo the headline sits on mustard next to the big community logo, like the community's Instagram posts. Considered: a plain page heading (looked like an inner page) and no title. Same day: community pages default to cream, with mustard only for the header, the banner and chosen accents (all-mustard pages were tiring to read).

### S18. Colours are a palette edited in Site settings (Dávid, 2026-11-24)
Site settings → Colours lists the colours (name, code, text colour); the built-in ones can be changed and new ones added; every colour choice in the Studio offers them as swatches and stores the colour's id. The page carries the palette as CSS variables, so a change applies everywhere at once. Chosen over a colour code on every block, which would let the same brand colour drift between sections. Readability is a warning, never a block. The pickers are attached in `studio/sanity.config.ts` (form.components), not in the schema files, because `npm run check` loads the schema in plain Node.

### S19. The Studio deploys itself from GitHub (Dávid, 2026-11-24)
A GitHub workflow runs `npm run studio:deploy` when Studio code or the dependencies change on `main`, with a Sanity token limited to "Deploy Studio" stored as the repository secret `SANITY_AUTH_TOKEN`. Why: deploying needed a computer with the project and a Sanity sign-in, and was easy to forget. The site itself is still built by Cloudflare.

### S20. A phone version on the Image block (Dávid, 2026-11-24)
The Wix program page shows a different picture on narrow screens. The Image block got an optional "Phone version", used below 720 px (the festival banner's breakpoint), in the page and in the photo viewer. A field on the existing block rather than a separate block: it works everywhere and the editor does not choose between two nearly identical blocks. Other photo fields have none yet; add the same field there if asked.

### S21. A banner video on the festival home (Dávid, 2026-11-24)
As on Wix, the festival banner can show a short silent looping video. The admin uploads an MP4 or WebM (Festival → Home page → Banner video); it is served from Sanity's file server like the photos. It plays on screens 720 px and wider only, never with "reduce motion" or data saver, and never without JavaScript: a small inline script loads it, so phones never download it. The banner photo shows until the video plays, and whenever it cannot. Why Sanity: one place to upload, no code change to replace it. Cost: Sanity's free plan has a monthly bandwidth quota for assets; a 5 MB clip on computers only stays well inside it. If not, serve the file from Cloudflare (only `getVideo` changes). Considered: `<video autoplay>` in the HTML (phones would download it); a YouTube or Vimeo background (third-party requests, branding).

### S22. Page titles use Platypi (2026-11-24)
The Wix site sets its page titles in Platypi Bold. Only those titles use it, through the `--title` variable; other headings keep Fraunces. Self-hosted from `@fontsource-variable/platypi`.

### S23. Fonts are chosen in Site settings, from a fixed list (2026-11-24)
Site settings → Fonts chooses one font for each of the four kinds of text the design uses (titles, headings and large text, menu/buttons/labels, body), each mapped onto an existing CSS variable. The list is eight self-hosted fonts picked to work together; a browser downloads only those in use. Sizes, weights and text colours are not settable: free choices are how a look drifts, and text colour already follows the background (S18). Font files cannot be uploaded: they would be served from Sanity (decision 10). A new font in the list is a small code change (`ARCHITECTURE.md`).

### S24. A separate browser-tab icon field (Dávid, 2026-11-24)
Festival and Community home pages each have an optional "Browser tab icon", so a logo made for the tab can be uploaded later. Until then the festival uses its big banner logo (else the small one) and the community its top-bar logo (else the round Forró Budapest logo).

### S25. The scroll bar colour per part of the site (Dávid, 2026-11-24)
Site settings → Colours has a scroll bar colour for the festival (default Cream) and for the community (default Light cream). The standard `scrollbar-color` alone did nothing in Safari (before 26.2 it is ignored; 26.2+ colours the bar only on macOS 26), and Safari and Chrome most likely ignore `::-webkit-scrollbar` once `scrollbar-color` is set. So where scroll bars stay on screen (a mouse, Windows, "always show" on a Mac; a small script in `<head>` detects it and adds `.classic-scrollbars`), Safari and Chrome get `::-webkit-scrollbar`; where they hide until you scroll (Mac trackpads, phones), only `scrollbar-color`, because `::-webkit-scrollbar` would keep them on screen. Dávid prefers them hiding, at the cost of a grey bar there in Safari before macOS 26. Firefox always gets `scrollbar-color`. Tested in Chromium, not on a Mac.

### S26. "Edit on the page" follows the editor, and links in it work (Dávid, 2026-11-24)
The tool opened on the festival home whatever was being edited, and clicks on menu items and buttons opened their text instead of the page (Sanity's overlays cancel clicks on texts with markers, and link labels have them). Now the Studio remembers the document whose form was last shown and starts the tool on its page (`previewUrl.initial`), and the preview script catches a plain click on a link to another page of the site before the overlays do and goes there. Link texts lose click-to-edit and are changed in the form. Considered: removing markers from link texts (same result, more places to change) and only documenting Option-click. The link clicks are tested in [8] with a stand-in for the overlays and were tried once in a frame connected like the Studio's; the start page has not been tried in the deployed Studio from a cloud session.

### S27. Drag to reorder on the page: tried and parked (2026-11-24)
Click-to-edit polish B (whole blocks as click targets) and D (drag blocks, gallery photos, columns and chosen people into a new order in Edit on the page) were built on branch `feature/drag-blocks-on-page` and not merged. `@sanity/visual-editing` 6.2.1 can drag without React; each list item needs a `data-sanity` attribute and, since Sanity only drags the innermost target under the mouse, a grip to press on. With a stand-in for the Studio everything worked. In the real Studio (local preview, Safari and Chrome) the grips appeared but dragging did nothing; cause not found (a guess: Sanity's own labels and menus over the hovered element may sit over the grip). Parked: blocks are reordered in the form, and Edit on the page only works on a computer anyway. Revisit only if the admin asks; the branch's `DECISIONS.md` S27 has the details.

## Superseded

Decisions of the Pages CMS proof of concept (2026-11-11) that no longer apply. Their full text is in the tag `pages-cms-poc`.

| # | Was | Replaced by |
|---|---|---|
| 3 | Editing through Pages CMS forms; content as files in GitHub | Sanity Studio (S3, S12). The forms proved unintuitive for the admin (2026-11-15) |
| 6 | Fixed content types; the program as uploaded images | The page builder (S2); the program is a page of Image blocks |
| 7 | No links between content entries | People blocks and buttons refer to people and pages (S2) |
| 9 | Own photo resize step for uploads in `public/uploads` | Sanity's image service (S4); the resize step remains only for `/uploads/` paths |
| 13 | Hosting on GitHub Pages | Cloudflare Workers (S11); hosting of the real site is `backlog.json` FB-30 |
| 14 | Publishing by a GitHub Actions build on every push | Workers Builds and the Sanity webhook (S11); GitHub only runs `npm run check` and deploys the Studio |
| 17 | Text page bodies in JSON, rendered with `marked` | Sanity rich text (S6) |
| 18 | Documentation layout of the proof of concept | `docs/HANDOFF.md`, "The documents" |

## History

- **2026-11-11** First prototype, then a revision after review: community site with the festival below, two languages, program as images, the Wix look, warnings that never block. Built on Astro with Pages CMS forms and GitHub Pages.
- **2026-11-15** Pages CMS connected and found unintuitive for the admin; Sanity with click-to-edit proposed.
- **2026-11-16** Sanity choices confirmed (S1-S4).
- **2026-11-17** Sanity proof of concept built offline (S5-S7).
- **2026-11-18** Content imported, Studio deployed, click-to-edit built and approved (S8, S9); Free plan (S10); hosting code ready (S11).
- **2026-11-23** Online: preview and test site on Cloudflare, Publish rebuilds; `main` became the Sanity version (S12); look polish against Wix starts (S13-S15).
- **2026-11-24** Community level designed (S16, S17); palette, fonts and Studio self-deploy (S18-S25); click-to-edit fixes and the parked drag experiment (S26, S27).
