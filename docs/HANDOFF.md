# Handoff: start here

If you are picking this project up with no other context, read this file and `SANITY-PORT-STATUS.md` first, then `USER-NEEDS.md` (who it is for and how little is verified), `DECISIONS.md` (why), `SPEC.md` (what the site does) and `ARCHITECTURE.md` (how the code is organised). `CLAUDE.md` has the rules for a Claude session working in the repo. The root-level [EDITING-GUIDE.md](../EDITING-GUIDE.md) is for the old Pages CMS PoC; [docs/EDITING-GUIDE.md](EDITING-GUIDE.md) is the admin guide for Sanity; check it against the deployed Studio before sending it.

## Current handoff (2026-11-24)

- **Working mode:** Dávid sends what bothers him on the test site, often as screenshots (Wix for reference, the test site, the Studio), sometimes in Hungarian; the agent fixes it, runs `npm run check`, looks at it at phone and desktop width, and pushes straight to `main`. He changes his mind sometimes: reverting is fine (`git revert`). Before a design change he is unsure about, show a mock-up (screenshots of a local build via SendUserFile) instead of pushing. Commit messages are neutral (`CLAUDE.md`).
- **What changed 2026-11-23/24:** see `BACKLOG.md`, "Look polish done", and `DECISIONS.md` S13-S19. In short: Wix sizes, red, fonts and buttons on the festival; a community level with its own palette, logo, headline banner and menu; galleries with Mosaic and a photo viewer; the event calendar; colours as a palette in Site settings; the Studio menu in Festival and Community folders.
- **The Studio deploys itself** when its code changes on `main` (S19). Dávid no longer runs `npm run studio:deploy`. After a Studio change, tell him to reload the Studio tab about two minutes later. The run can be checked at github.com/davidpalfi/forro-bp-website/actions (public API: `curl https://api.github.com/repos/davidpalfi/forro-bp-website/actions/runs`).
- **Content lives in Sanity; the agent cannot reach it** (sanity.io and the workers.dev sites are blocked from cloud sessions). For content, give Dávid click-by-click Studio steps (menu paths as in `docs/EDITING-GUIDE.md`, e.g. "Community → Pages"). To check a change visually, build locally with test content: `CONTENT_SOURCE=file:<some.ndjson> npm run build`, made from `scripts/lib/sanity-fixture.mjs` plus the documents you need, then serve `dist/` and screenshot with Playwright.
- **Screenshots from Dávid's phone or Mac carry a colour profile** (Display P3): convert to sRGB before measuring colours (PIL `ImageCms`), or the values come out wrong (this happened with the first mustard).
- **Open for Dávid in the Studio** and **parked ideas:** `BACKLOG.md`, top. The admin has not seen anything yet (13a on hold).

## Earlier handoff (2026-11-23)

- **`main` is the Sanity version** (S12, 2026-11-23). The Pages CMS proof of concept is retired and kept as the tag `pages-cms-poc`; its GitHub Pages workflow and `.pages.yml` are removed. Code changes: pushed straight to `main` after `npm run check` passes (Dávid, 2026-11-23; revert if something breaks); every push to `main` rebuilds both Cloudflare sites. Both Workers' production branch and the test site's deploy hook were switched to `main` the same day; a test Publish rebuilt the test site from `main`. All branches other than `main` are deleted.

- **Online** (Dávid set up 2026-11-22/23, `HOSTING.md`): preview https://forro-budapest-preview.pdavid92.workers.dev (Worker `forro-budapest-preview`, its own Viewer token `Cloudflare preview` as a Cloudflare secret), test site https://forro-bp-website.pdavid92.workers.dev (Worker `forro-bp-website`; `wrangler.site.jsonc` renamed to match). Both build `main`; builds for other branches off. **Publish rebuilds the test site: tested by Dávid 2026-11-23** (Sanity webhook "Rebuild test site" > Workers Builds deploy hook "Sanity publish"). Tested during Sanity's Growth trial; webhooks are not among the Growth features the trial lists, so they are expected to work on Free; publish one test change after the trial ends (around 2026-12-18) to confirm.
- **Preview lock verified for real in Safari (Dávid, 2026-11-23):** the strip shows on the preview address opened directly and is gone inside the deployed Studio's Edit on the page, so the partitioned cookie works in Safari's frame. No-reload update inside the Studio works (no flash; 2-3 s delay, fine for now; BACKLOG polish H).
- `studio/.env.production` holds the preview address; the Studio is deployed with it.
- **Done 2026-11-23 (Dávid):** the old GitHub Pages site is turned off and the Pages CMS app removed from this repository.
- **Ideas raised 2026-11-23, not decided:** a video banner on the festival home, more text choices in the editor (`BACKLOG.md`, under the plan).
- **Next (plan agreed 2026-11-23, top of `BACKLOG.md`):** a more mature version before the admin sees it: (1) polish how the site looks (waiting for Dávid's list, or his go for an agent review), (2) Dávid decides on click-to-edit polish B-G on a separate branch, (3) send it to her (13a).
- **Working agreement:** start work only when Dávid gives a clear go; when he is planning or asking, answer and plan only.
- Retry build in Workers Builds rebuilds the same commit; to start a build after changing settings, push a change. Ignore Cloudflare's "update wrangler.jsonc name" suggestion for the test site (it reads the preview's file).
- Editing outlines on the preview opened outside the Studio (only on hover): Dávid is fine with them (2026-11-23).
- The npm package is now named `forro-bp-site`.

## Earlier handoff (2026-11-18, night)

- **Go-live code is done** (`DECISIONS.md` S11): preview on Cloudflare Workers with the preview lock (Dávid chose it), no reload after an edit (polish A, Dávid chose it first), test site rebuilt on Publish via a Sanity webhook and a Cloudflare deploy hook. `npm run check` [8] tests it in Cloudflare's local runtime with a stand-in for Sanity. Not tested against the real Studio, Sanity or Cloudflare (blocked from cloud sessions).
- **Waiting for Dávid:** [HOSTING.md](HOSTING.md) (two Workers, the token as a Cloudflare secret, deploy hook, Sanity webhook). He sends the two `workers.dev` addresses (not secret). Then: preview address into `studio/.env.production` (`SANITY_STUDIO_PREVIEW_URL=https://...`), test address into `docs/EDITING-GUIDE.md`, he runs `npm run studio:deploy` and tries Edit on the page and Publish, especially in Safari (partitioned cookie in the Studio's frame). If drafts never show inside the Studio, the cookie is blocked: next step would be carrying the lock in the address instead (S11, considered).
- Still open: the domain (launch only); polish B-G after her review.

## Earlier handoff (2026-11-18, late evening)

- **Next task: go live for the admin's review** (online preview with a lock, test site rebuilt on Publish, Studio redeployed, guide finished). Dávid's checklist is in the root [README.md](../README.md); the agent's brief is at the top of [BACKLOG.md](BACKLOG.md). Dávid's account steps are done (2026-11-18, late evening): Sanity stays on the **Free plan** with both him and the admin as **Administrators** (`DECISIONS.md` S10; the Growth trial downgrades to Free by itself), and a **Cloudflare account exists** (he signed in with GitHub; no project created, repository not connected: tell him exactly what to click when the code is ready). The invite test was moved to just before he sends her the link. Click-to-edit polish A-G comes after her review (A possibly before).
- **Decided since:** the preview lock and polish A first (both built, S11). **Still open:** the real domain (.com, .hu or both), only needed for launch. Keep instructions for Dávid short, click by click, with direct links; he sometimes works from a phone.
- **Cloud agent sessions** cannot open sanity.io (blocked by the session's network settings); a web search worked. Docs-only changes are pushed straight to the working branch, now `main` (agreed 2026-11-18 for the then working branch `feature/sanity`); code too since 2026-11-23, after `npm run check` passes.
- **Click-to-edit is built and approved.** Dávid tried it on his computer on 2026-11-18 (`npm run preview:edit` plus the local Studio's "Edit on the page") and found it "pretty awesome"; Sanity stays (`DECISIONS.md` S8 outcome, S9; `SPEC.md` 11.7).
- Confirmed against the real project on 2026-11-18: Dávid is signed in, the content is imported and the photos repaired, the Studio is deployed (without "Edit on the page"; do not redeploy before the preview is hosted), the dataset can be read without a token, and `CONTENT_SOURCE=sanity npm run build` passes. Dávid has also published one community page himself.
- Dávid's `.env` holds his Viewer token for the preview. Never read it out, print it or ask for it.
- Run `npm run` commands from the project folder (`cd ~/src/forro-budapest-site`), not from the home folder.

- **Read [SANITY-PORT-STATUS.md](SANITY-PORT-STATUS.md) first.** It has the state, what was and was not verified, and the exact next commands.
- The Sanity proof of concept was built on branch `feature/sanity` (merged into `main` 2026-11-23): refined Studio schemas, the site rendering Sanity documents (from Sanity, or from the JSON files converted to the same documents), a repeatable import file and command, a wider `npm run check`, and the admin guide [EDITING-GUIDE.md](EDITING-GUIDE.md). Decisions S5-S7 in `DECISIONS.md`; behaviour in `SPEC.md` section 11; code map in `ARCHITECTURE.md`.
- The default build still reads the JSON files and looks the same as the live proof of concept. `main`, its GitHub Pages site and `.pages.yml` are unchanged.
- Not built: hosted preview, rebuild on publish, hosting choice. See [BACKLOG.md](BACKLOG.md).
- The sections below document the original Pages CMS proof of concept.

## Original Pages CMS PoC (2026-11-11)

- **What:** one static website (Astro) for the Forró Budapest community. The community level is an empty shell; the Budapest Forró Festival sits below it at `/<lang>/festival/`. English and Hungarian. The look is copied from the festival's current Wix site (forrobudapest.com), which this is meant to replace.
- **How it is edited:** content is JSON files in this repo. A free editor (Pages CMS) gives the non-technical admin forms that save those files. GitHub Pages builds and hosts it.
- **What the owner wants, in order:** the admin updates it herself; no subscription or paid accounts; hard to break.
- **State:** a proof of concept to show the admin. It builds, the automated checks pass, and it was looked at in a browser at phone and desktop size. It has **never been on GitHub**, and **Pages CMS has never been connected**. Photos, the logo and most longer texts are placeholders.
- **First thing to do:** publish it and run the editor trial with the admin (steps 1 to 3 below). The whole plan rests on that.

## Original PoC status (2026-11-11; historical)

Done:
- Pages in both languages: community home, festival home, program, teachers, artists, text pages (location, code of conduct), 404, and the language redirect on `/`.
- Content model with both languages side by side, falling back to the other language when one is empty.
- The Wix look on phones and desktop, built from screenshots of both: red pages, dark people cards (two side by side on desktop), cream text pages, grey footer, sticky header with the one-row desktop menu and cream ticket button, full-screen phone menu, torn-paper buttons, banner block to the left on desktop.
- Editing forms (`.pages.yml`), written from the Pages CMS docs.
- Lenient content handling, photo resizing, safe links, sharing image and language tags.
- Two workflows: deploy (one build per push) and check (only when code changes).
- `npm run check`: 35 assertions over four builds, all passing.
- Looked at in Chromium at eleven widths from 320 to 1920 px in both languages: no horizontal scrolling, no console errors, no third-party requests; the menu button works; `/` redirects by browser language and without JavaScript.

Real content already in place (taken from the Wix site):
- Festival name, dates, ticket link, Instagram link, contact email.
- The home page intro and the line of numbers, in both languages.
- The names, roles and Instagram links of the six teachers and six artists (Hungarian role only where it was seen: "Tánctanár").
- Page headings seen on the Wix site.
- The English code of conduct, **without** the care team's names and phone numbers (left out of a public repository on purpose; the admin can add them).

Placeholders, to be replaced:
- **All images**: logo (the name is shown as text), banner photo, program graphic, every person's photo, location photos.
- **All bios**, in both languages. The tool used to read the Wix site would not copy long texts word for word, and the Hungarian pages could not be opened from the sandbox. Pasting them in is a natural part of the editor trial.
- **The location text**: a short summary in both languages, marked as placeholder wording.
- Hungarian: the code of conduct, the artists page heading, the roles "Consent Facilitator" and "Music Teacher", the ticket button label. These show the English text until filled in.
- The fixed Hungarian wording in `src/lib/i18n.ts` was written by Claude; a native speaker should read it once.

Not done:
- Anything on GitHub: repository, Pages, the workflows' first run.
- Connecting Pages CMS and the admin's trial (AC13 to AC15 in `SPEC.md`).
- The admin's sign-off on the look (AC16). The fonts are a match by eye. The Wix site uses a different banner photo on desktop (people dancing) than on phones (the aerial view); both slots exist in the form (banner photo, banner photo for phones) and both hold a placeholder until her files arrive.
- The community level's content.
- Domain move and redirects.
- Browsers other than Chromium; a real accessibility review.
- The changes of 2026-11-11 are in the working folder but **not committed** to Git.

## Superseded Pages CMS next steps

The sequence below was written for the original Pages CMS/GitHub Pages plan and is no longer the launch plan. Use [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md) for Sanity. The old-address table below remains useful when planning redirects.

1. **Publish on GitHub Pages.** Commit the working folder. Create an empty public repository, add it as `origin`, push `main`. In the repository: Settings > Pages > Build and deployment > Source: **GitHub Actions**. Watch the Actions tab; the address is `https://<user>.github.io/<repo>/`. If a workflow fails, read its log: the workflows were written from documentation and have not run yet.
2. **Connect Pages CMS** (pagescms.org, sign in with GitHub, install its app on the repository). Walk through every form and fill in the assumptions table in `DECISIONS.md`: what exactly is saved for photos, photo lists, rich text and selects? Fix code or config where it differs.
3. **Editor trial with the admin.** Invite her by email. On her own phone: sign in, add a teacher with a photo and both bios, replace the program image, change the intro. Watch, do not help. If signing in is a struggle, stop and reconsider the editor (decision 3); the content files stay the same.
4. **Show her the result and collect design corrections**: fonts, desktop layout, anything that differs from her design. Get the real logo, banner and program graphics as files.
5. **Fill in the real content** through the editor (bios, location text, Hungarian gaps).
6. **Decide the community level** with her, then design its content types (`ARCHITECTURE.md`, "Add a new kind of content").
7. **Launch.** Decide public or private repository (decision 13). Find out where the domain is registered; do not cancel Wix until the new site is live and the domain points to it. Add redirects for the old addresses (below). Put the domain in `public/CNAME`, set it under Settings > Pages, and turn off "Hide the site from Google".

### Old addresses to redirect at launch

| Old (Wix) | New |
|---|---|
| `/` | `/en/festival/` (or the community home, to be decided) |
| `/program` | `/en/festival/program/` |
| `/teachers` | `/en/festival/teachers/` |
| `/music` | `/en/festival/artists/` |
| `/location` | `/en/festival/location/` |
| `/code-of-conduct` | `/en/festival/code-of-conduct/` |
| `/hu`, `/hu/...` | `/hu/festival/...` (the exact Hungarian addresses on Wix were not read; check them) |

GitHub Pages has no server-side redirects; each old address needs a small page that forwards, or a host that supports redirect rules (Cloudflare Pages does).

## Commands

```
npm ci             # once (exact versions from the lockfile)
npm run dev        # preview at http://localhost:4321 (resizes photos first)
npm run build      # builds dist/ ; read any [content-warning] lines
npm run check      # the test suite, about 20-40 seconds
npm run studio     # start Sanity Studio at http://localhost:3333
npm run studio:build
npm run studio:deploy  # deploy to Sanity hosting; requires account access
npm run sanity:login   # sign in to Sanity on this computer (once)
npm run sanity:import-file  # write sanity-import/ from src/content; sends nothing
npm run sanity:import  # write it and import missing documents into Sanity
npm run sanity:import-replace  # overwrite the imported documents with the import file (before the admin starts only)
CONTENT_SOURCE=sanity npm run build   # build from the published content in Sanity
npm run preview:edit   # click-to-edit preview at http://localhost:4322 (drafts; needs .env, see .env.example)
npm run preview:build  # the same preview built for Cloudflare (docs/HOSTING.md); preview:local runs it at :4323
```

Needs Node 22.23.4 or newer. Build for a sub-path locally: `SITE_URL=https://x.github.io SITE_BASE=/repo npm run build`.

## How to check things

**Automated:** `npm run check`. A code change is not done until it passes.

**In a browser (manual):** build, serve `dist/` (`python3 -m http.server 8777 --directory dist`), and look at these at 390 and 1280 px wide: `/en/`, `/hu/festival/`, `/en/festival/program/`, `/hu/festival/teachers/`, `/en/festival/artists/`, `/en/festival/location/`, `/en/festival/code-of-conduct/`, `/404.html`. Check:
- no horizontal scrolling (`document.documentElement.scrollWidth > window.innerWidth` is false) and no console errors;
- no request leaves the site (network tab);
- at 390 px the menu button opens the full-screen menu and Escape closes it;
- `/` lands on `/hu/` in a browser set to Hungarian, on the default language otherwise, and still redirects with JavaScript off;
- the language switch on an inner page leads to the same page in the other language.

Playwright with Chromium does all of this in a script; it was used for the 2026-11-11 check.

## Known issues and limits

- The program is images: not readable by screen readers or search engines unless the optional text is filled in.
- People photos have empty alt text; there is no alt-text field in the forms.
- A push to `main` deploys without waiting for the checks, so run `npm run check` before pushing.
- Free GitHub Pages needs a public repository (decision 13).
- Original photos are stored in Git and re-encoded on every build; fine for tens, slow for hundreds.
- The header's language switch is two plain links, not the flag drop-down of the Wix site.
- No sitemap, analytics or forms.
- The `.pages.yml` forms are untested against the live tool.

## Glossary

- **CMS:** the editing layer; here, forms that save the content files.
- **Collection:** a folder of similar files (people, text pages).
- **Build:** turning the content files and code into the finished pages in `dist/`.
- **Static site:** the finished pages are ready-made files; nothing runs on a server when someone visits.
- **Workflow:** a script GitHub runs for you on each push (here: build and publish).
