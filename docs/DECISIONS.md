# Decision log

Read this before changing the structure of the site. When you change or add a decision, update this file in the same commit. Keep entries short: what was decided, why, what else was considered, and what would make us revisit it.

Last full revision: 2026-11-11, after a design review and a look at every page of the current Wix site. What changed in that revision is listed under "History" at the end.

## Current port status (2026-11-17)

This file's numbered decisions describe the original Pages CMS/GitHub Pages proof of concept. A Sanity port was proposed after Pages CMS was connected and found unintuitive. The direction is Sanity with an Astro visual-editing preview. On `feature/sanity` the Studio, the migration and the site's Sanity read path are built and tested offline (S5 to S7); preview and publish rebuild are not. Do not apply the old decisions below as instructions for the port without checking this status and the brief.

| Area | Original PoC | Sanity port status |
|---|---|---|
| Content/editor | JSON in GitHub, Pages CMS forms | Sanity, Studio hosted by Sanity (S3); schemas refined (S5); import file and command built (S7), not yet run against Sanity |
| Public site | Static Astro on GitHub Pages | Static; built from Sanity documents, from Sanity or from the JSON files (S6); hosting not finalized |
| Visual editing | None | SSR preview on Cloudflare proposed; not implemented |
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

### Still open for the port
- Whether Cloudflare hosts only the click-to-edit preview or the public site too.
- The rebuild mechanism when she publishes (webhook and provider).
- Sanity's current free-plan limits, dataset visibility, seats and roles, and the invited-editor sign-in: verify before relying on them.
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
The Wix look needs a serif and two sans-serif fonts. They are installed as npm packages (`@fontsource-variable/fraunces`, `libre-franklin`, `open-sans`) and served from the site itself. No external fonts, scripts, trackers or embeds.
Why: independence, speed, no cookie banner. The font choices are a **visual match by eye**, not confirmed; ask the admin which fonts the Wix design uses.

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
- The fonts used in the Wix design.
- Where the domain is registered and when the Wix plan renews. Do not cancel Wix until the new site is live and the domain points to it.
- Whether the repository may stay public after launch (decision 13).
- Who owns the GitHub repository and the Pages CMS installation. It should be the admin or a community organisation account, not one developer's personal account.
- Who receives build-failure emails.

## History

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
