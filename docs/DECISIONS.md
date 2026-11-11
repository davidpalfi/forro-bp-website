# Decision log

Read this before changing the structure of the site. When you change or add a decision, update this file in the same commit. Keep entries short: what was decided, why, what else was considered, and what would make us revisit it.

Last full revision: 2026-11-11, after a design review and a look at every page of the current Wix site. What changed in that revision is listed under "History" at the end.

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
`EDITING-GUIDE.md` is for the admin. `CLAUDE.md` holds the rules for a Claude session working for the maintainer. `README.md` covers setup and deployment. `docs/` explains the design. The Claude project holds copies of `docs/`; the repository is the source of truth.

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
