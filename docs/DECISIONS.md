# Decision log

Read this before changing the structure of the site. When you change or add a decision, update this file in the same commit. Keep entries short: what was decided, why, what else was considered, and what would make us revisit it.

## Context and priorities

The site replaces a Wix festival site (Budapest Forró Festival). The owner wants to stop paying the Wix subscription. Priorities, in order:

1. **The admin can update content herself.** She is not technical, so the setup must be robust and hard to break. She is also a designer, and her own design is still to come.
2. **Independence from outside providers.** Leaving Wix is the point. Every outside piece must be replaceable without rebuilding the site.
3. **Content is not final.** The real content types, page list and layout are undecided. This repo is a base to prototype on, not the finished site.
4. A developer maintains it, with a few technical people in the community as backup. Day-to-day content edits should never need them.

The site is mainly Hungarian. The prototype's wording is English and is configurable (see decision 12).

The needs behind these priorities, and how well each is known, are in `USER-NEEDS.md`. Only the three priorities above are firmly stated; page-level needs are assumptions.

## Decisions

### 1. Static site, no server and no database
Why: nothing to patch or hack, free hosting, fast, and it fits an idle site that peaks around the festival. Rejected: WordPress (needs paid hosting and regular security updates, which suits an idle site badly). Revisit if the site needs logins, payments or bookings; those are a different project.

### 2. Astro, not plain HTML
Why: pre-rendered HTML (good for search and link previews), typed content collections, and a widely supported tool. Cost: a build step, and Astro 7 needs Node 22.23.4 or newer. `.node-version` pins 22.23.4.

### 3. Pages CMS for editing, hosted on Cloudflare Pages, files in GitHub
Why: free, open source (can be self-hosted), form-based, and the content stays as plain files. Rejected: Sanity (content lives at a third party, more setup; the owner wants fewer dependencies), Decap (login setup is the usual sticking point), Keystatic and TinaCMS (more setup and friction). Revisit if the invited-editor sign-in is a struggle, if drafts and validation turn out to matter, or if content becomes heavily linked. Because the content is files, switching editors does not change the site.

### 4. Fixed collections, not flexible page blocks
Content is a few collections (events, people, links, text pages) plus two settings files (`home.json`, `site.json`). Pages are not built from mixed lists of blocks. Why: fewer ways for the editor to break things, and nothing in the Pages CMS block feature has been tested. Flexibility comes from text pages (Markdown), which become new pages automatically. Revisit when the real content shows what is missing.

### 5. Links between content are file paths, resolved by file name
An event's `people` field stores paths such as `src/content/people/teacher-anna.json`. The site uses only the file name (without extension), and ids are generated from file names (`generateId` in `src/content.config.ts`). A reference to a deleted person is ignored. Consequence: renaming a person's file silently unlinks them from events.

### 6. The code is lenient, the forms are strict
Every field is optional in `src/content.config.ts`, and empty, null or wrong-typed values are converted or fall back to defaults (`src/lib/schema.ts`); only unreadable file syntax, such as broken JSON, can fail a build. "Required" is enforced only in the forms (`.pages.yml`). Why: a failed build leaves the site unchanged and the editor has no idea why. Broken entries (for example an event without a valid date) are skipped and logged as `[content-warning]` lines in the build output. The warnings are the only signal, so read them.

### 7. Past events hide themselves in the browser
Each event row carries its date, and a small inline script hides rows before today. Why: no scheduled rebuilds are needed. Without JavaScript, everything stays visible. The home page also limits itself to the next 6 events at build time.

### 8. Photos: our own resize step
Uploads go to `public/uploads`. `scripts/optimize-images.mjs` runs before every build and writes web-sized WebP copies (480, 960 and 1600 px wide) to `public/_img` (not committed), plus a manifest the site reads. The script never fails the build; an unreadable photo falls back to the original. Why not Astro's built-in image handling: it needs images under `src/`, and the Pages CMS docs say nothing about how stored image paths work with Astro. Revisit once the real stored path format has been seen (see assumptions). Uploads are limited to JPG, PNG and WebP so unsupported formats are rejected clearly instead of failing quietly.

### 9. No third-party fonts, scripts or trackers
Why: independence, speed and avoiding privacy-consent problems. System fonts are used. Self-host a font if the design needs one. Add analytics only when someone asks, and choose one that needs no consent banner or decide on the banner then.

### 10. Link safety
Only `https://`, `http://`, `mailto:` and site-relative links are rendered (`safeUrl` in `src/lib/content.ts`). The forms also require `https://`.

### 11. The prototype hides itself from Google
`noindex` in `site.json` defaults to true. Turn it off when the site goes live.

### 12. One language for now; wording is configurable
All fixed wording (menu, headings, messages) lives in `site.json` under `labels`, and date language under `locale`. A real two-language site (for example `/hu/` and `/en/`) is not designed. It would roughly double the content to edit, so decide it deliberately with the admin.

### 13. Documentation for people and for Claude
`EDITING-GUIDE.md` is for the editor. `CLAUDE.md` holds the rules for any Claude session that edits this repo. `README.md` covers setup and deployment.

### 14. GitHub Pages for the test deployment (and possibly beyond)
The test site is published with GitHub Pages through a GitHub Actions workflow (`.github/workflows/deploy.yml`). Why: free, one fewer account than Cloudflare, and the repo is already on GitHub. The code does not depend on it: the address comes from `SITE_URL`/`SITE_BASE`, so Cloudflare Pages, Netlify or a custom domain work by setting those variables. The repository is public for the test (placeholder content only); GitHub Pages on a private repo needs a paid plan. Revisit before real content and the real domain, and re-check decision 3 (the README still describes Cloudflare as the production option; either works).

### 15. Check before deploy; the host never sees a broken build
The workflow runs `npm run check` first and deploys only if it passes and the build succeeds. A failed run leaves the previous deployment online (standard Pages behaviour: a deployment replaces the old one only when it succeeds; not yet confirmed here). Content warnings are copied into the run summary by `scripts/ci-build.mjs`. A check failing because of a content edit is possible only for things the check asserts about the real content (for example `[content-warning]` lines); that is deliberate, so mistakes are noticed before publishing.

### 16. Pinned versions
`astro` and `sharp` are exact versions, `package-lock.json` is committed and installs use `npm ci`, and `.node-version` is the exact Node 22.23.4. Why: the site should not change or break because a dependency released a new version. Upgrade deliberately (see ARCHITECTURE). Workflow actions use major-version tags (`actions/checkout@v7`, `actions/setup-node@v7`, `withastro/action@v6`, `actions/deploy-pages@v5`) taken from their documentation on 2026-11-11; they were not run against a real repository. If the first run complains about an action, check its current version.

### 17. Base path via environment variables, Markdown rewritten after rendering
`base` in `astro.config.mjs` comes from `SITE_BASE`. Markdown pages are rewritten with `rebaseHtml()` because the `markdown.rehypePlugins` option needs an extra package under Astro 7 (the default processor changed). Considered: adding `@astrojs/markdown-remark` (more dependency for one small job).

## Assumptions not yet verified

`.pages.yml` was written from the Pages CMS documentation. The live tool has not been run against it. Check these on the first test and fix the code or config where they are wrong:

| Assumption | What breaks if it is wrong |
|---|---|
| Image fields store the media `output` path plus file name (for example `/uploads/photo.jpg`) | Photos would not match the resize manifest or would be left out; check the first saved person file |
| Reference fields with `value: "{path}"` store a repo-relative file path | Teachers would silently not show on program items (matching uses the file name only) |
| The `{fields.date}-{primary}.json` file name pattern works for JSON, and two items with the same title and date do not clash | Odd file names or overwritten items |
| Select fields store the option text as written | The people page would not group by role |
| Date fields store `yyyy-MM-dd` | Events are skipped with a warning |
| Empty optional fields are saved as empty strings or omitted | Already tolerated, but forms may show validation errors on empty link fields |
| `format: yaml-frontmatter` with a `body` rich-text field suits the Markdown pages | Text pages lose their body |
| Invited editors without a GitHub account can sign in easily | The central assumption of the setup; see the README, "First test" |
| Cloudflare Pages keeps the previous version live when a build fails | A bad edit could take the site down |
| The GitHub workflow runs as written (action versions, `withastro/action` honouring `node-version`, `build-cmd` and the `SITE_*` variables set through `GITHUB_ENV`) | First deployment fails; read the run log and adjust the workflow |
| A Pages CMS save (a commit to `main`) triggers the workflow | Edits would not go live automatically |
| Pages CMS commits made as the app, not a person, still trigger workflows | Same |

## What was tested, and what was not

Tested (by running them; the build-level checks are now repeatable with `npm run check`, and the browser checks have a recipe in `HANDOFF.md`):
- The build passes, producing all pages.
- Mobile and desktop screenshots look right, with no horizontal overflow or console errors.
- Past events are hidden with JavaScript on and shown with it off.
- A deliberately broken copy still builds: an event with no date, an impossible date, null fields, a deleted person reference, a missing photo, a `javascript:` link, a reserved page name, and settings with null values. Each was skipped or fell back, with a warning, and no unsafe link or broken image reached the output.
- The photo script handles an oversized photo with a rotation tag from a phone.
- Hungarian date formatting works.
- `.pages.yml` parses, and every field in the content files has a matching form field.

Not tested:
- The live Pages CMS (every row of the table above).
- Deployment on Cloudflare Pages and the domain switch.
- Real phone photos in other formats (HEIC is not accepted).
- Accessibility beyond basics (focus styles, skip link, contrast by eye), and browsers other than Chromium.
- Browser behaviour (hiding past events, layout) is not part of `npm run check`; it was checked by hand once.

## Open questions

- The real content types, page list and languages, and how often the admin updates.
- The admin's own design. It replaces `src/styles/global.css` and the markup in `src/pages` and `src/components`; the content stays.
- Where the domain is registered, and when the Wix plan renews. Do not cancel Wix until the new site is live and the domain points to it.
- Who receives build-failure emails.

## History

An earlier throwaway version (plain HTML and JavaScript reading JSON files in the browser, no build step) was used to practise the idea. It is superseded and not part of this repo.
