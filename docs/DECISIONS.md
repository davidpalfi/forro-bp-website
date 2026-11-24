# Decision log

Read this before changing the structure of the site. When you change or add a decision, update this file in the same commit. Keep entries short: what was decided, why, what else was considered, and what would make us revisit it.

Last full revision: 2026-11-11, after a design review and a look at every page of the current Wix site. What changed in that revision is listed under "History" at the end.

## Current port status (2026-11-18)

This file's numbered decisions describe the original Pages CMS/GitHub Pages proof of concept. A Sanity port was proposed after Pages CMS was connected and found unintuitive. The direction is Sanity with an Astro visual-editing preview. On `feature/sanity` the Studio, the migration and the site's Sanity read path are built (S5 to S7); the content is imported and the Studio deployed (2026-11-18). Click-to-edit works as a local preview on the maintainer's computer (S9) and Dávid approved it (S8 outcome); polishing it, hosting it and the publish rebuild are next. Do not apply the old decisions below as instructions for the port without checking this status and the brief.

| Area | Original PoC | Sanity port status |
|---|---|---|
| Content/editor | JSON in GitHub, Pages CMS forms | Sanity, Studio hosted by Sanity (S3); schemas refined (S5); content imported by Dávid 2026-11-18 (S7; photos need one re-import, S9) |
| Public site | Static Astro on GitHub Pages | Static; built from Sanity documents, from Sanity or from the JSON files (S6); hosting not finalized |
| Visual editing | None | Click-to-edit preview (S9), locked, online on Cloudflare (S11) |
| Languages | English and Hungarian side by side, with fallback | **Confirmed 2026-11-16:** kept (S1 below) |
| Page content | Fixed fields and Markdown/HTML JSON bodies | **Confirmed 2026-11-16:** full page builder (S2 below) |
| Images | Local uploads resized at build time | **Confirmed 2026-11-16:** Sanity image service (S4 below) |
| Publishing | GitHub Actions on pushes to `main` | Sanity publish should trigger a rebuild; mechanism/provider not implemented |

The only hard account constraint confirmed in the port brief is no subscription. Re-check the current Sanity free plan and Cloudflare terms before launch; old provider assumptions below are historical. The source brief is [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md); current task inventory is [SANITY-PORT-STATUS.md](SANITY-PORT-STATUS.md).

## Sanity port decisions (confirmed by Dávid, 2026-11-16)

These are settled. Do not ask about them again; build to them. The initial Studio and schemas are implemented under `studio/`; Astro pages still use the existing JSON content. Each choice can be changed later if it does not work for the admin.

### S1. Languages: English and Hungarian side by side in each entry
One entry per person or page, with the English and Hungarian fields next to each other. Things that are the same in both languages (name, photo, links) are entered once. If one language is empty, the page shows the other. Considered: a separate entry per language (photos and links entered twice; the two drift apart). Dávid: "we change later if it's not good".

### S2. Page content: a full page builder
Chosen because the exact pages and layouts are not known yet, so the admin should have the most freedom a block system can give. This goes further than the brief's proposal (blocks on the home and text pages only).
- The admin can **create new pages** herself and add them to the menu.
- **Every page is a list of blocks** she adds, removes and reorders. Core set to start with: heading, text, image, gallery, button, banner, a row of columns, embedded video, divider, people grid.
- **Teachers and artists stay reusable entries** (name, photo, bio, links). They are placed on a page with the people grid block, so a person is entered once and the cards stay consistent.
- **Each block has a few style options** from the site's design, such as background colour (red, cream, dark) and alignment.

Limits, stated to Dávid: her freedom is within the blocks that exist. There is no free drag-to-any-position as in Wix, and a new kind of block is a code change. Do not guess further blocks now; add them when the admin's drawings arrive.
Considered: fixed fields everywhere (as in the PoC); blocks only on the home and text pages; blocks everywhere with no reusable people entries (cards would become inconsistent).
This replaces decision 6 (fixed content types) for the port.

### S3. Editor: Sanity Studio hosted by Sanity
The admin opens an address at Sanity (`<name>.sanity.studio`). Why: free, nothing to maintain, the site stays simpler. Considered: Studio embedded in the site at `/admin` (ties the editor to the site's hosting and makes the site more complicated).

### S4. Photos: Sanity's image service
The admin uploads, crops and sets the focus point in the editor; Sanity resizes for phones and desktops; visitors load photos from Sanity's servers. Why: simpler, and better for her. Cost: photos depend on Sanity's free plan, which Dávid accepts as long as there is no subscription. Considered: downloading and resizing at build time so everything is served from our own host (more code, less cropping convenience); it can be switched to later without the admin noticing.
This replaces decisions 9 (own resize step) and 10 (no third-party requests) for the port. Fonts stay self-hosted.

### S5. Content model refinements (Claude, 2026-11-17, for Dávid to review)
Made while mapping every JSON field to Sanity. Each keeps today's site and makes the editor simpler for the admin:
- **Program, Teachers and Artists are ordinary pages** (`program`, `teachers`, `artists`) made of blocks, not built-in templates. The admin can edit, reorder or hide them like any page; nothing is reserved under `/festival/`. The People block shows everyone in its group when no one is picked, so a new teacher appears without touching the page.
- **The two home pages hold their blocks themselves** (`homeBlocks` in Festival and Community home page), instead of pointing at a separate page document that must not be deleted. `programPage` and `homePage` references were removed.
- **Pages have a colour (red, cream, dark), an optional big heading and an optional top photo**, which reproduce the old red pages (program, people) and cream text pages.
- **Text blocks have a style (Normal, Large, Statement)** for the festival introduction and the numbers line. **Buttons link to a chosen page** (the label defaults to its name) or to an address. **Images** can be wide, text width or full width; **columns** can have a photo.
- **Names are entered once** (community, festival, person), as S1 says for things the same in both languages. The phone banner photo was added to the festival.
- **Video** embeds YouTube through youtube-nocookie.com and Vimeo with `dnt=1`, loaded only when the block is used. This is the one exception to "no third-party requests" besides Sanity's photos.
Revisit when the admin has tried it.

### S6. One rendering path; the JSON files become Sanity documents
The site only knows Sanity documents. The JSON files are converted to the same documents (`src/lib/from-json.ts`) at build time, and the same conversion writes the import file. Why: the existing test suite (forgiving content, warnings, base paths) now tests the Sanity rendering and the migration mapping at once, and a test proves the import file and the JSON files give an identical site. `CONTENT_SOURCE` picks the source; it stays `json` by default until Sanity holds the imported content, then the build switches with one setting. Considered: a separate Sanity-only code path (two renderers to keep in step), and switching straight to Sanity (the site could not be built or tested before the import).
Text that the old editor saved as Markdown is converted to Sanity rich text. An image written inside Markdown text is not a rich-text feature in Sanity; use an Image block.

### S7. Migration by import file, run by Dávid
`npm run sanity:import` imports with `--missing`: it only creates documents that are not in Sanity yet, so a repeat never overwrites the admin's work, and nothing is deleted. Ids are fixed and contain no dots (Sanity hides dotted ids from public reads). Why an import file and not a script with a write token: no token is needed anywhere but Dávid's own signed-in computer, and the file can be read before it is sent. `--replace` resets documents to the JSON content and is only for before the admin starts.

### S8. Click-to-edit before hosting (Dávid, 2026-11-18)
After seeing the Sanity editor, Dávid found it still "just forms", like Pages CMS. Gains so far (page builder, photo cropping, drafts and history, a tidier editor) do not answer the original complaint (USER-NEEDS N9). So click-to-edit is built next, first on his computer, before hosting or the publish rebuild: it is the cheapest test of whether Sanity solves the problem. If it does not feel clearly better, reconsider the editor before investing further. Click-to-edit is a computer workflow; on a phone she uses the forms.
**Outcome (2026-11-18, evening):** Dávid tried it on his computer, clicked texts and photos, edited, and made a community page in the Studio unaided: "works pretty awesome". **Sanity stays.** He wants it polished as far as Sanity allows, then hosted for a live demo; the polish list (A-G) is at the top of `BACKLOG.md`.

### S9. How click-to-edit is built (Claude, 2026-11-18, for Dávid to review)
- **A separate preview mode, not a change to the public build.** `npm run preview:edit` runs Astro's dev server with `PREVIEW=1` on its own port, 4322 (Astro 7 otherwise reuses an already running `npm run dev` without telling); only then is `astro.config.mjs` switched to on-request rendering (`output: 'server'`), the `.env` file read and the editing script added. The public `npm run build` is byte-for-byte the same as before (compared on 2026-11-18) and `npm run check` [6] [7] proves it carries no script, click targets or markers. Locally no adapter is needed; a hosted preview will need one (`@astrojs/cloudflare` is installed).
- **Fresh drafts on every request.** `src/middleware.ts` loads all documents with the `drafts` perspective (drafts over published) for each page request and hands them to `useDocuments()` in `content.ts`, which rebuilds the lists every helper reads. Pages are unchanged; the two page routes look their page up by address instead of taking it from `getStaticPaths`. The documents are swapped for the whole module, not per request: every request loads the complete set, so a request running alongside another can only see the same or newer content. About 20 documents load in well under a second.
- **How a click finds its field.** Texts carry Sanity's invisible "stega" markers (`@sanity/client`, now a declared dependency, pinned to the 8.16.0 that was already installed). Only fields ending in `_en`/`_hu` (and their rich text) and names get markers; values the code compares or uses as addresses (tone, group, section, slug, links, e-mail) never do, or the site would break. Photos cannot carry markers, so in preview each photo object is noted with its document and field, and its `<img>` gets a `data-sanity` attribute. Markers survive the Markdown step of rich text (checked on the Location page).
- **The editing script** is `@sanity/visual-editing`, bundled by Astro and served by the preview itself (no outside request), added by a small integration in `astro.config.mjs` that exists only in preview. Putting it in `Base.astro`, even behind a condition, made the public build bundle it into `dist/_astro`, so it was moved out.
- **After an edit the page updates without reloading** (since 2026-11-18, S11; at first it reloaded): `refresh` in `src/lib/preview-client.ts` fetches the page again and swaps its content.
- **Access.** Locked with Sanity's preview secret since 2026-11-18 (S11): drafts only for a browser that opened the preview from the signed-in Studio; otherwise published content only.
- **Studio:** a second tool, "Edit on the page" (Presentation), next to "Content", which stays first so a deployed Studio opens on the familiar lists. Its address comes from `SANITY_STUDIO_PREVIEW_URL` (default `http://localhost:4322`). Until the preview is hosted, use the local Studio (`npm run studio`, `http://localhost:3333`, already allowed by the project's CORS settings); deploying this Studio now would give the admin a tab that cannot load.
- **Photo import fix.** The first import (2026-11-18) stored every photo as a photo within a photo: the import file put the upload marker inside `asset` instead of on the photo. `make-sanity-import.mjs` is fixed and checked ([5]); the site still shows the old shape, with a `[content-warning]`. `npm run sanity:import-replace` re-imports the 20 documents with the fixed file. On 2026-11-18 no published document had been changed since the import, so nothing is lost; drafts are not touched.

### S10. Sanity plan and the admin's role (Dávid, 2026-11-18)
Stay on Sanity's **Free plan**. The admin gets the **Administrator** role; Dávid stays Administrator too, so either can recover access. Why: on Free the only roles are Administrator and Viewer (no Editor; Editor starts on Growth at about $15 per seat per month), and she is the owner of the site, so full rights are right for her. Mistakes are undone with Sanity's document history. Considered: Growth for an Editor-only role (a subscription, against the no-subscription constraint). Later: possibly move ownership/billing of the Sanity organization to her.
Source: web search of sanity.io/pricing and the roles docs on 2026-11-18 (Free: 20 seats, Viewers do not use a seat, roles Administrator and Viewer; custom roles Enterprise only). Confirmed the same day from Dávid's screenshot of the organization's plan page: Free is "up to 20 user seats, 2 permission roles, 2 datasets (public only), live previews and visual editing tools", and the organization is on a Growth trial that downgrades to Free automatically (no charge; the end date is not shown). So build only on what Free offers: Administrator and Viewer roles, a public dataset (published content is readable by anyone, drafts are not; no private details in content), and check that the publish webhook works on Free.

### S11. Hosting the preview and the test site; the preview lock (Claude, 2026-11-18; lock and polish A chosen by Dávid)
- **Both on Cloudflare Workers, free plan**, built by Cloudflare's Workers Builds from `feature/sanity`: `forro-budapest-preview` (`wrangler.jsonc`, `npm run preview:build`, the `@astrojs/cloudflare` 14.4.8 adapter, on-request rendering) and `forro-bp-website` (`wrangler.site.jsonc`, the normal static build with `CONTENT_SOURCE=sanity`, files only). Setup steps for Dávid: `HOSTING.md`. Why Workers and not Pages: the installed adapter supports only Workers; one product for both keeps the dashboard simple; Workers Builds has deploy hooks (since 2026-04). Free plan, checked by web search 2026-11-18: 3,000 build minutes a month, 1 build at a time, 100,000 requests a day. Considered: Cloudflare Pages for the test site (works too, but a second product); GitHub Pages for the test site (no deploy hook a Sanity webhook can call without a token).
- **The public build is unchanged** (byte-for-byte compared 2026-11-18). The adapter is loaded only for the hosted preview (`astro.config.mjs`, `hosted`); `npm run preview:edit` still runs on Node on Dávid's computer.
- **No file reads in the preview**: content comes only from Sanity (the JSON files and `from-json.ts` are imported only by a build that uses them), photos from `/uploads/` are linked as they are. Settings come from Cloudflare at run time: `SANITY_VIEWER_TOKEN` (secret), `SANITY_STUDIO_URL` (in `wrangler.jsonc`); `PREVIEW` is written into the code at build time.
- **One content set per request.** On Cloudflare one Worker serves several requests at once, and with the lock some see drafts and some do not, so the module-wide swap of S9 was not safe any more: each request now renders inside `withDocuments()` (AsyncLocalStorage) with its own documents, and the page is rendered completely before it is sent. Tested with 16 mixed requests at once (`npm run check` [8]).
- **The preview lock** (`src/lib/preview-lock.ts`, Dávid chose it 2026-11-18): the Studio's Presentation tool opens `/preview/enable/` with a one-hour secret it stores in the dataset; the preview checks it with Sanity (`@sanity/preview-url-secret` 4.1.5, with the Viewer token) and sets a cookie signed with a key derived from the token, valid 12 hours, `HttpOnly; SameSite=None; Secure; Partitioned` (Safari 18.4+ drops cross-site cookies in frames without `Partitioned`, per Sanity's draft-mode guide). Without a valid cookie the preview asks Sanity only for published content (no token used) and shows a strip saying drafts are hidden. Considered: Cloudflare Access (another login for the admin, against priority 1); a secret in the address (leaks when copied). Risk: a browser that blocks even partitioned cookies sees no drafts in the frame; workaround "Open preview" in a new tab (`HOSTING.md`).
- **Polish A, no reload** (Dávid chose to do it before the review): after a save the page is fetched in the background and the content of `<body>` swapped, keeping Sanity's overlay element and the scroll position; the menu script is run again; any error falls back to a reload. Not letter by letter (Sanity saves after a pause).
- **Studio**: `previewMode.enable` set; the deployed Studio gets the preview's address from `studio/.env.production`, and `npm run studio:deploy` refuses to deploy without an `https://` address there (`scripts/studio-deploy-check.mjs`), so the admin can never get a tab pointing at `localhost`.
- **Verified 2026-11-23 by Dávid on the real setup:** Workers Builds, the Publish rebuild through the Sanity webhook (tested during Sanity's Growth trial; webhooks are not among the Growth features the trial lists, so they are expected to work on Free; publish one test change after the trial ends (around 2026-12-18) to confirm), and the lock in Safari (drafts inside the Studio, the strip outside).
- **Originally not verified** (cloud sessions cannot reach Sanity or Cloudflare): the real Presentation handshake, the cookie inside the Studio's frame in Safari, Workers Builds and the deploy hook, and whether the Sanity webhook is available on Free. Tested instead with a stand-in for Sanity in Cloudflare's local runtime (`scripts/check-preview.mjs`).

### S12. Sanity is the site; `main` carries it (Dávid, 2026-11-23)
Dávid committed to Sanity: `feature/sanity` was merged into `main`, which is now the branch both Cloudflare Workers build. The Pages CMS proof of concept is retired: its GitHub Pages workflow (`deploy.yml`, `scripts/ci-build.mjs`) and forms (`.pages.yml`) were removed, and its last state is kept as the Git tag `pages-cms-poc` (release "Pages CMS proof of concept"). Why: Sanity's editor and click-to-edit fit the admin far better than Pages CMS did (priority 1), and one main branch is simpler. The JSON files in `src/content` stay as the import source and test content. Supersedes decisions 3, 13 and 14 for the live setup.

### S13. Closer to the Wix look; code pushed straight to `main` (Dávid, 2026-11-23)
Dávid compared the test site with the Wix site in the same window and asked for: the Wix red (`#c80a2f`); text, banner logo, banner button and date at about the Wix sizes; the date in the top bar; a separate small logo for the top bar; the language switch as a flag drop-down between the menu and the Tickets button; the Wix torn-paper ticket buttons; the Instagram icon in the footer; justified paragraphs (sorkizárt) without hyphenation; no second ticket link at the bottom of the festival home. Later the same day: the Wix paper texture behind cream pages, text on cream in the Wix dark grey, and for galleries a Mosaic layout and a full-screen photo viewer like Wix's (own inline script, no external code). The ticket buttons use the Wix button images with the words taken out (`src/styles/ticket-*.png`), so the label stays live text: translated, editable in the Studio and readable by screen readers. The flags and the Instagram icon are Dávid's PNGs in `public/icons/`. This settles the justified-text, language-switch and Instagram questions of backlog item 19 (Dávid's choice; the admin can still ask for changes). Also: code changes are pushed straight to `main` once `npm run check` passes, and reverted if something breaks.

### S14. The community level has its own palette (Dávid, 2026-11-23)
The community home and community pages use the Forró Budapest palette from the community's Instagram posts: gold (`#c28f32`, measured from the round Forró Budapest logo) instead of the festival red, light cream (`#e9eadc`), dark grey text (`#2e2e2e`, as the footer) and dark grey buttons with cream text (blue `#344893` and cream buttons tried first and dropped the same day). The festival keeps the Wix red. Text on gold is dark: cream on gold measures 2.4:1, too faint to read. Done with CSS variables scoped to `.in-community`, so every component follows without changes.

### S15. Event calendar: one picture per month, inside the block (Dávid, 2026-11-23)
An "Event calendar" block holds the months (year, month, calendar picture) and shows them one at a time with arrows, opening on the current month; past months disappear by themselves (at build time and, since the site is only rebuilt on publish, again in the visitor's browser). The months live inside the block, where the editor already is on the page: a first version kept them as separate documents in their own Studio list, which nobody would find, and was replaced the same day. The calendar is a picture (as on Instagram), so a month is just a picture; it opens large in the photo viewer. Chosen over a hover drop-down (no hover on phones) and a full calendar. A plain inline script in `Base.astro`, no external code. The preview's update-without-reload does not rerun the script, so while editing all months are listed until the page is reloaded.

### S16. The community menu's festival button is a page entry (Dávid, 2026-11-24)
A community page can be set to "Menu button goes to: The festival". It then has no address or content of its own and appears in the community menu with its title or menu label, menu order and "Show in the menu", linking to the festival home. This replaces the "Festival link" settings on the Community home page (added the day before), so the festival button is ordered and renamed in the same place as every other menu button. Without such a page a festival button comes first, so the community menu never loses its way to the festival. The festival section at the bottom of the community home page was removed; the way to the festival is the menu.

### S17. Community home: a headline banner (Dávid, 2026-11-24)
The community home starts with a headline that says what Forró Budapest is, a short line and up to two buttons, as modern home pages do, instead of a banner with only the name (the name is already in the logo). The banner photo is optional: without it the headline sits on mustard next to the big community logo, like the community's Instagram posts. All of it is edited on Community → Home page. Considered: a plain page heading (looked like an inner page) and no title at all. Same day: community pages default to cream with mustard only for the header, the banner and chosen accents, since all-mustard pages were too much colour and tiring to read.

### S18. Colours are a palette edited in Site settings (Dávid, 2026-11-24)
Colours are global: Site settings → Colours lists them (name, code, text colour), the built-in ones can be changed and new ones added, and every colour choice in the Studio offers them as swatches, storing the colour's id. The page carries the palette as CSS variables, so a change applies everywhere at once. Chosen over a colour code on every block, which would let the same brand colour drift between sections and make a later change a hunt through every block. Readability is a warning, never a block. The top bar and the language list colours can be chosen per part of the site. The pickers are attached in `studio/sanity.config.ts` (form.components) rather than in the schema files, because npm run check loads the schema in plain Node.

### S19. The Studio deploys itself from GitHub (Dávid, 2026-11-24)
A GitHub workflow runs `npm run studio:deploy` when Studio code or the dependencies change on `main`, with a Sanity token limited to "Deploy Studio" stored as the repository secret `SANITY_AUTH_TOKEN` (never in the repository). Why: deploying needed a computer with the project and a Sanity sign-in, and was easy to forget after a Studio change. The site itself is still built by Cloudflare.

### S20. A phone version on the Image block (Dávid, 2026-11-24)
The Wix program page shows a different picture on narrow screens than on wide ones. The Image block got an optional "Phone version": below 720 px wide (the same breakpoint as the festival banner's phone photo) the page and the photo viewer show it instead. A field on the existing block rather than a separate "adaptive image" block: it works on every page without code changes, and the editor does not have to choose between two nearly identical blocks or rebuild a block to add a phone version later. Other photo fields (galleries, banner and columns blocks) have none yet; add the same field there if it is asked for.

### S21. A banner video on the festival home (Dávid, 2026-11-24)
As on the Wix site, the festival banner can show a short silent looping video instead of the photo. The admin uploads an MP4 (or WebM) in Festival → Home page → Banner video; it is stored in Sanity and served from Sanity's file server (`cdn.sanity.io/files/...`), like the photos (S4). It plays on screens 720 px and wider only, never with "reduce motion" or data saver, and never without JavaScript: the page carries the address in a `data-` attribute and a small inline script in `Base.astro` loads it, so phones never download it. The banner photo stays underneath and shows until the video plays, and whenever it cannot. Why Sanity and not a file on Cloudflare: one place to upload, no code change to replace it. Cost: Sanity's free plan includes a monthly bandwidth quota for assets (100 GB at the Growth plan's announcement; check sanity.io/pricing); a 5 MB clip on computers only stays well inside it for this site's traffic. If it ever does not, serve the file from Cloudflare instead (the field stays, only `getVideo` changes). Considered: `<video autoplay>` in the HTML (simpler, but phones would download it and it would ignore "reduce motion"); a YouTube or Vimeo background (third-party requests, branding, slower).

### S22. Page titles use Platypi (2026-11-24)
The Wix site sets its page titles (the red band at the top of inner pages, e.g. "Your daily rhythm...") in Platypi Bold (its CSS names `orig_platypi_bold`). Only those titles use it, through the `--title` variable; every other heading and the large intro text keep Fraunces. Self-hosted from `@fontsource-variable/platypi` like the other fonts (decision 10); free under the SIL Open Font License.

### S23. Fonts are chosen in Site settings, from a fixed list (2026-11-24)
Site settings → Fonts chooses one font for each of the four kinds of text the design already uses: page titles, headings and large text, menu/buttons/bold labels, body text. Each maps onto an existing CSS variable, so the stylesheet barely changed and a choice applies everywhere at once. The list is eight self-hosted fonts picked to work together (three serifs, five sans-serifs); a browser downloads only the ones in use. Sizes, weights and text colours are not settable: free choices are how a modern look drifts, and text colour already follows the background colour (S18), so a second text colour setting would fight it. Font files cannot be uploaded: they would be served from Sanity, a third-party request for fonts (decision 10). A new font in the list is a small code change (`ARCHITECTURE.md`).

### S24. A separate browser-tab icon field (Dávid, 2026-11-24)
Festival home page and Community home page each have an optional "Browser tab icon", so a logo made just for the tab can be uploaded later. Until then the festival uses its big banner logo (else the small one) and the community its top-bar logo (else the round Forró Budapest logo).

### S25. The scroll bar colour per part of the site, styled with ::-webkit-scrollbar (Dávid, 2026-11-24)
Site settings → Colours has a scroll bar colour for the festival (default Cream) and one for the community (default Light cream; as everywhere on community pages, Festival red and Cream show as Mustard and Light cream), like the top bar and the language list. The single site-wide `scrollbarColour` is gone; a value left in Sanity shows as an unknown field to remove. The first version used only the standard `scrollbar-color`, which did nothing in Safari: Safari before 26.2 ignores it, and 26.2+ colours the bar only on macOS 26 (MDN browser-compat-data issue 29315) and, like Chrome, most likely ignores `::-webkit-scrollbar` once `scrollbar-color` is set. Not tested on a Mac; Chromium was. So where scroll bars stay on screen (a mouse, Windows, "always show" on a Mac; a small script in `<head>` measures it and adds `.classic-scrollbars` to `html`), Safari and Chrome get `::-webkit-scrollbar`, which every Safari colours. Where scroll bars hide until you scroll (Mac trackpads, phones), they only get `scrollbar-color`, because `::-webkit-scrollbar` would keep them always on screen; Dávid prefers them hiding (same day), at the cost of a grey bar there in Safari before macOS 26. Firefox always gets `scrollbar-color`.

### S26. "Edit on the page" follows the editor, and links in it work (Dávid, 2026-11-24)
The tool opened on the festival home whatever was being edited, and clicks on menu items and buttons opened their text instead of the page: Sanity's overlays cancel clicks on texts with click-to-edit markers, and link labels have them (Option/Alt-click went through, which nobody would guess). Now the Studio remembers the document whose form was last shown (`form.components.input` at the document's root) and `previewUrl.initial`, a function evaluated each time the tool opens, starts on its page; and the preview script catches a plain click on a link to another page of the site before the overlays do (window, capture phase) and goes there. Link texts lose click-to-edit and are changed in the form, which is where Presentation shows the page's document anyway; little is lost, since a click on a menu item used to open the linked page's title field, which did not read as editing (Dávid had not noticed it). Considered: removing the markers from link texts (same result, more places to change) and only documenting Option-click. The start page has not been tried in the deployed Studio from a cloud session (Sanity is blocked there); the link clicks are tested in [8] with a stand-in for the overlays, and were tried once in a frame connected like the Studio's (Sanity's own connection code, a menu label with real markers): before, the click stayed on the page and asked the Studio to open the Program page's title; after, it went to the Program page.

### S27. Whole blocks are click targets and can be dragged into a new order (2026-11-24)
Click-to-edit polish B and D (`BACKLOG.md`), on the branch `feature/drag-blocks-on-page` until Dávid has tried them in the Studio. In the preview every block's outer element carries a `data-sanity` attribute with its place in the page's list (`blocks:<key>` or `homeBlocks:<key>`), and so do each gallery photo, each column and, in a People block with chosen people, each card. A click on a block's edge opens the whole block, with its Style tab; elements of items of the same list can be dragged. Dragging needs no code of ours: `@sanity/visual-editing` 6.2.1 does it in its plain (non-React) part, and saves the new order as a draft through the Studio's editing channel, which the Studio switches on (`visual-editing/features`, `optimistic: true`); the page then shows the new order through the usual update without reload (P20), so it jumps into place after 2-3 seconds instead of sliding. Where a photo fills the block (Image block, Banner with a photo) the photo carries the block's target, so the block can be grabbed and a click opens the block (photo, phone version, caption) instead of only the photo field. A text directly in a block's element (Heading, Statement) gets its own `<span>`, so the block and the text stay separate targets. People shown as a whole group are not draggable: their order is each person's Display order. Video blocks can only be grabbed at their caption (the player takes the mouse). Public builds are unchanged (no attributes, no spans; [7]). Not tested: the drag itself, which needs the real Studio (blocked from cloud sessions); [8] checks the targets.

### Still open for the port
- Whether Cloudflare also hosts the real public site at launch (the test site is there, S11).
- The invited-editor sign-in. The publish webhook after the trial ends: webhooks are not among the Growth features the trial lists, so they are expected to work on Free; publish one test change after the trial ends (around 2026-12-18) to confirm.
- The admin's own trial of the editor; click-to-edit is expected to be a desktop workflow.

## Context and priorities

The Forró Budapest community wants one website. Today it has only a festival site on Wix (forrobudapest.com, Budapest Forró Festival). The plan:

- Build a **community site**. Its main level is empty for now.
- The **festival** becomes a section one level below (`/festival/`).
- The whole site uses the **look of the current Wix festival site**. The admin agreed to this.
- **English and Hungarian** from the start (the Wix site already has both).

Priorities, in order:

1. **The admin can update content herself.** She is not technical. She is a designer and made the Wix design.
2. **No running costs and no dependence on a paid provider.** Leaving Wix is about cutting the subscription. This rules out anything that needs a paid plan or account for her, including a paid Claude plan.
3. **Robust and hard to break.**
4. A developer maintains it, with a few technical people in the community as backup.

The needs behind these, and how well each is known, are in `USER-NEEDS.md`.

## Decisions

### 1. Static site, no server and no database
Why: nothing to patch or hack, free hosting, fast. Rejected: WordPress (paid hosting, regular security updates). Revisit if the site needs logins, payments or bookings.

### 2. Astro
Why: pre-rendered HTML, typed content collections, widely supported. Cost: a build step. Astro 7 needs Node 22.23.4 or newer; `.node-version` pins it.

### 3. Editing through Pages CMS forms; content stays as files in GitHub
Why: free, open source, form-based, and invited editors sign in by email without a GitHub account. Rejected: Sanity (content at a third party), Decap (login setup), Keystatic and TinaCMS (more setup).

**Claude is not an editing path for the admin.** It would need a paid plan and a GitHub account, which priority 2 rules out. Claude is a tool for the maintainer only (`CLAUDE.md`).

Revisit if the invited-editor sign-in is a struggle (this is still untested and is the first thing to test). Because the content is files, another editor can replace Pages CMS without changing the site.

### 4. One site, two levels: community above, festival below
Addresses: `/<lang>/` is the community home, `/<lang>/festival/...` is the festival. The community level is an empty shell with the same header, banner and footer; content types for it (classes, events) are **not designed yet** and should be designed when the admin knows what she wants there.
Why: the admin and owner agreed the festival moves under a community site, and that the festival design is reused. Considered: two separate sites (two things to maintain and two designs).

### 5. Two languages, in the address, with both languages in one entry
- Every page exists at `/en/...` and `/hu/...`. The root `/` sends the visitor to Hungarian if the browser prefers Hungarian, otherwise to the default language (`defaultLang` in `site.json`).
- Each content entry holds both languages side by side: `bio_en` and `bio_hu`, `title_en` and `title_hu`. Things that are the same in both (name, photo, Instagram link, order) are entered once.
- If one language is empty, the page shows the other language instead of a gap.
- Short fixed wording (menu words, "Skip to content", the 404 text) lives in `src/lib/i18n.ts`, not in the forms.

Why side by side: she writes both languages herself, sees at once which translation is missing, and cannot end up with a teacher who exists in only one language. Considered: a separate folder of files per language (clean files, but every photo and link entered twice, and the two sets drift apart). Revisit if a third language is ever needed; side-by-side forms get long.

### 6. Fixed content types that match the real site
Content is: festival settings (one file), people (teachers and artists), text pages, plus site and community settings. Pages are not built from free blocks.

**The program is uploaded images, not structured data.** The Wix site publishes the program as graphics the admin designs, the same image for both languages. So there is no event collection, no dates to parse and no hiding of past events. An optional text field under the images exists for notes.
Why: this is how she already works, and it removed the most fragile part of the first prototype. Cost: the program is not readable by screen readers or search engines; the text field is the place to add a plain version if wanted. Revisit if she wants an editable text schedule, or when the community level needs dated events.

### 7. Links between content: none
The first prototype linked events to people by file path. With the program as images, nothing references anything else. Renaming or deleting an entry cannot break another one.

### 8. The code is lenient, and warnings never block publishing
Every field is optional in `src/content.config.ts`; empty, null or wrong-typed values are converted or fall back (`src/lib/schema.ts`). Only unreadable file syntax (broken JSON) fails a build. "Required" is enforced only in the forms (`.pages.yml`).

Problems found at build time are logged as `[content-warning]` lines and copied to the run summary on GitHub. **They do not stop the deployment.**
Why: if publishing stopped, the admin would see nothing happen and not know why, and every later edit would be stuck too. The first prototype blocked publishing on any warning, including a phone photo over 8 MB; that contradicted this decision and was removed.

### 9. Photos: our own resize step
Uploads go to `public/uploads`. `scripts/optimize-images.mjs` runs before every build and writes WebP copies (480, 960, 1600 px wide) to `public/_img` (not committed), plus a manifest. It never fails the build. Uploads are limited to JPG, PNG and WebP in the forms.
Why not Astro's built-in image handling: it wants images under `src/`, and how Pages CMS stores image paths is unverified. Revisit once the stored path format has been seen.
Known cost: original photos live in Git, and every build re-encodes all of them. Fine for tens of photos; revisit with hundreds.

### 10. Fonts are self-hosted; no third-party requests at all
The Wix look needs a serif and two sans-serif fonts. They are installed as npm packages (`@fontsource-variable/platypi` for page titles, `fraunces`, `libre-franklin`, `open-sans`) and served from the site itself. No external fonts, scripts, trackers or embeds.
Why: independence, speed, no cookie banner. Page titles use Platypi, the font the Wix site uses for them (S22); the other serif (Fraunces) and the two sans-serif fonts are still a **visual match by eye**, not confirmed; ask the admin which fonts the Wix design uses.

### 11. Link safety
Only `https://`, `http://`, `mailto:` and site-relative links are rendered (`safeUrl`). The forms also require `https://`.

### 12. The prototype hides itself from Google
`noindex` in `site.json` defaults to true. Turn it off at launch.

### 13. Hosting: GitHub Pages for the proof of concept
Published by `.github/workflows/deploy.yml`. Why: free, and one fewer account. The code does not depend on it: the address comes from `SITE_URL` and `SITE_BASE`.
Caveat: free GitHub Pages needs a **public repository**, so everything in it (photos, texts, edit history) is public. That is acceptable for the proof of concept because the content is already public on the Wix site. Before launch, decide between staying public, a paid GitHub plan, or Cloudflare Pages (free with a private repository).

### 14. Publishing is one build; the test suite runs only when code changes
- `deploy.yml`: every push to `main` builds once and deploys. If the build fails, nothing is deployed and the previous version stays online.
- `check.yml`: runs `npm run check` (several test builds) only when something outside `src/content` and `public/uploads` changes, and on pull requests.

Why: the first prototype ran five builds for every content edit, so a saved change took far longer than "a couple of minutes". Content edits cannot break code, so they do not need the code tests. Cost: a code push to `main` deploys without waiting for the checks; make code changes on a branch with a pull request.

### 15. Pinned versions
All dependencies are exact versions, `package-lock.json` is committed, installs use `npm ci`, `.node-version` is exact. Upgrade deliberately (see ARCHITECTURE). Node 22 leaves maintenance in spring 2027; plan one upgrade before then. Workflow actions use major-version tags taken from documentation; they have not been run on a real repository.

### 16. Base path from environment variables
`base` in `astro.config.mjs` comes from `SITE_BASE`. Every internal address goes through `withBase()`; HTML made from text-page bodies is rewritten by `rebaseHtml()`.

### 17. Text page bodies are stored in JSON and rendered with `marked`
A text page is one JSON file with `body_en` and `body_hu`. The body is rendered by the `marked` package, which accepts both Markdown and HTML.
Why: both languages must live in one entry (decision 5), which a Markdown file with a single body cannot do. And it is not yet known whether the Pages CMS rich-text field saves Markdown or HTML; this works with either.

### 18. Documentation
For the original PoC, root `EDITING-GUIDE.md` was the admin guide. It now applies only to Pages CMS; `docs/EDITING-GUIDE.md` is the provisional Sanity guide. `CLAUDE.md` holds maintainer-session rules, `README.md` covers setup and deployment, and `docs/` is the repository's design and handoff record.

## Assumptions not yet verified

`.pages.yml` was written from the Pages CMS documentation. The live tool has never been connected. Check these on the first test and fix the code or config where they are wrong:

| Assumption | What breaks if it is wrong |
|---|---|
| Invited editors without a GitHub account can sign in easily, on a phone | The central assumption; the whole editing plan |
| Image fields store the media `output` path plus file name (`/uploads/photo.jpg`) | Photos would not match the resize manifest; check the first saved person |
| An image field with `list: true` stores a list of such paths | The program images and page galleries would not show |
| The `rich-text` field stores Markdown or HTML as a string in JSON | Text page bodies would be empty or show raw markup |
| Select fields store the option text as written (`Teacher`, `Artist`) | People would not appear on the right page |
| File names made from `{primary}` cope with accents (for example "Dóri Czakó") | Odd file names; harmless to the site but untidy |
| Empty optional fields are saved as empty strings or omitted | Already tolerated; forms may complain about empty link fields |
| A Pages CMS save (a commit to `main` by the app) triggers the workflow | Edits would not go live automatically |
| The workflows run as written (action versions, `withastro/action` inputs) | First deployment fails; read the run log |
| A failed build leaves the previous version live | A bad change could take the site down |

## What was tested, and what was not

See `HANDOFF.md`, "Status", for the current test record. In short: the build, the automated checks and a browser look at phone and desktop sizes were done in a sandbox. Nothing involving GitHub, Pages CMS or the admin has been tested.

## Open questions

- What the community level should contain (classes, events, people?), and its design details.
- The real image files: logo, banner photo, program graphics, people photos, location photos.
- The fonts used in the Wix design, apart from the page titles (Platypi, S22).
- Where the domain is registered and when the Wix plan renews. Do not cancel Wix until the new site is live and the domain points to it.
- Whether the repository may stay public after launch (decision 13).
- Who owns the GitHub repository and the Pages CMS installation. It should be the admin or a community organisation account, not one developer's personal account.
- Who receives build-failure emails.

## History

**2026-11-18, late evening: ready to go online.** Preview on Cloudflare with the preview lock, test site rebuilt on Publish, no reload after an edit (S11). Waiting for Dávid to create the two Workers (`HOSTING.md`).

**2026-11-18, evening: click-to-edit approved; polish next.** Dávid ran the photo repair (`npm run sanity:import-replace`; all photos now stored correctly) and tried click-to-edit with drafts: approved (S8 outcome). Next: polish A-G, then a hosted preview for a demo (`BACKLOG.md`). He also asked for Events, Contact and About Us on the community level (backlog item 26).

**2026-11-18, click-to-edit built (local).** Preview mode, Studio "Edit on the page", photo click targets, checks that public builds carry none of it (S9). Found and fixed the photo shape of the import file. Confirmed against the real project: content imported (20 documents, 6 photos), Studio deployed, dataset readable without a token, `CONTENT_SOURCE=sanity npm run build` passes. Waiting for Dávid's verdict on click-to-edit (S8).

**2026-11-18, click-to-edit first.** Dávid's review of the editor; S8. Backlog reordered.

**2026-11-17, proof of concept on Sanity.** Schemas refined (S5); the site renders Sanity documents and the JSON files are converted to them (S6); import file and command (S7); `npm run check` gained a schema check and two sections for the import file and Sanity-shaped content; admin guide written (`docs/EDITING-GUIDE.md`). Not run against the real Sanity project: this session had no network access to Sanity.

**2026-11-16, Sanity port choices confirmed.** Dávid confirmed four choices: languages side by side, a full page builder (more freedom than the brief proposed), Studio hosted by Sanity, photos from Sanity's image service. See "Sanity port decisions" above.

**2026-11-17, Stage 1 Studio and schemas.** Added a Sanity-hosted Studio for project `8hc671sk` / dataset `production`, with side-by-side English/Hungarian fields, singleton site/community/festival settings, reusable people, pages with the agreed block types, and Sanity image fields with hotspot cropping. The work uses standard Studio features and the pinned Sanity packages. It does not change Astro page rendering, migration, preview, or publishing workflows.

**2026-11-15, Sanity port proposed.** Pages CMS was connected to the live proof of concept and found unintuitive for the admin. Sanity with click-to-edit was selected for exploration. This changes the direction of decisions 1, 3, 6, 9, 10, 13 and 17, but the detailed choices remain subject to owner confirmation. See the current port status above and `SANITY-PORT-STATUS.md`. No port implementation was present at this checkpoint.

**2026-11-11, first prototype (built by another Claude session).** A generic festival site: English only, events as structured data with client-side hiding of past events, events linked to people by file path, a "links" collection, system fonts, a placeholder design, and a deployment that ran the whole test suite before every publish and blocked on warnings.

**2026-11-11, revision after review.** Changed because of what the review and the real Wix site showed:
- Scope became a community site with the festival one level down (decision 4).
- Two languages, side by side in each entry (decision 5). Previously deferred.
- The event collection, past-event hiding, event-to-person links and the links collection were removed; the program is images (decisions 6 and 7).
- People are now two groups, teachers and artists, each with its own page, matching the Wix site.
- Warnings no longer block publishing, and content edits run one build instead of five (decisions 8 and 14).
- The design copies the Wix site; fonts are self-hosted (decision 10).
- Claude was dropped as an editing path for the admin (decision 3).
- Social sharing image (`og:image`) and language alternates were added.

An even earlier throwaway version (plain HTML reading JSON in the browser) is not part of this repository.
