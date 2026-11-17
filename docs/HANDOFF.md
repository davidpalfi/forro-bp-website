# Handoff: start here

If you are picking this project up with no other context, read this file first, then `USER-NEEDS.md` (who it is for and how little is verified), `DECISIONS.md` (why), `SPEC.md` (what the site does) and `ARCHITECTURE.md` (how the code is organised). `CLAUDE.md` has the rules for a Claude session working in the repo. The root-level [EDITING-GUIDE.md](../EDITING-GUIDE.md) is for the old Pages CMS PoC; [docs/EDITING-GUIDE.md](EDITING-GUIDE.md) is a draft for Sanity and is not ready to send to the admin.

## Current handoff (2026-11-17)

- The active work is on `feature/sanity`; keep `main`, the live GitHub Pages proof of concept, and `.pages.yml` unchanged.
- Stage 1 implementation is commit `2e6a644` (`feat: add Sanity Studio schemas`) on `feature/sanity`. It adds the Studio source/config under `studio/` for project `8hc671sk` and dataset `production`, with schemas for settings, reusable people, pages, all agreed blocks, Portable Text, and cropped images. The Studio has not yet been deployed to Sanity hosting.
- `npm run build`, `npm run check`, `npm run studio:build`, and `cd studio && npx sanity schemas validate` pass. The schema validator reports zero errors and warnings.
- Astro pages still read the existing JSON. No migration, Sanity query, Astro integration, preview, webhook, or deployment workflow is implemented.
- The choices in [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md) are confirmed in `DECISIONS.md`, S1-S4. Treat the schemas as implemented, but do not treat rendering or migration as implemented.
- Read [SANITY-PORT-STATUS.md](SANITY-PORT-STATUS.md) for the current inventory, [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md) for the owner and maintainer steps, and [EDITING-GUIDE.md](EDITING-GUIDE.md) for the not-yet-final admin guide.
- The sections below document the original Pages CMS proof of concept, not the Sanity branch's current behavior. For port requirements and known conflicts, see the status, decision, spec, and architecture notes linked above.

## Next steps for takeover

Do these on `feature/sanity`; keep `main`, its deployed PoC, and `.pages.yml` unchanged. The immediate next work is still the content/data layer, not a production launch.

1. **Verify Free-plan fit and deploy the Studio.** Check Sanity's current Free-plan limits (including Studio hosting, seats/roles, dataset visibility, and image usage), sign in using the maintainer's own account, run `npm run studio:deploy`, and verify the hosted Studio opens. Do not select or use Growth-only features. The hosted deployment and invited-editor sign-in are not yet tested.
2. **Reconcile the schemas with source content before importing.** Compare every file under `src/content/` with `studio/schemaTypes/`. In particular, account for community/festival home content, stats and intro fields, program image ordering, the phone hero image, page visibility/order flags, both languages, and any content that does not map cleanly into blocks. Update schemas and decisions/spec docs first if the model needs to change. S1-S4 are confirmed; hosting/provider details remain open.
3. **Design and test a safe migration.** Use stable Sanity document IDs and idempotent upsert behavior, provide a dry-run/report mode, preserve image and list order, and do not delete documents automatically. Test mapping and repeat-run behavior against a disposable fixture or dataset before touching `production`. The current branch has no migration script and has not written to Sanity.
4. **Implement and test the Sanity read layer.** Add GROQ queries and typed content helpers, preserve current route templates, bilingual fallback, safe-link handling, metadata, ordering, and image behavior, then switch Astro pages from JSON only after the data path is verified. Keep `src/content/` available as the migration source until parity is proven.
5. **Build the preview separately from public output.** Read current Cloudflare Free-plan terms and official Astro integration guidance first. Add SSR and Visual Editing only to preview mode; keep public output static, preview secrets server-side, and draft content out of public builds.
6. **Choose and implement publishing.** Decide whether Cloudflare also hosts production and select a rebuild provider/webhook. Store tokens and webhook secrets only in provider secret stores; test successful rebuild, failed-build behavior, and rollback.
7. **Prove acceptance before launch.** Run clean install, `npm run check`, `npm run build`, Studio/schema checks, and browser checks at phone and desktop sizes. Compare imported counts and representative bilingual records. Have the admin sign in, edit, preview, publish, and approve the result before changing traffic.

For detailed status, schema inventory, and completion gates, use [SANITY-PORT-STATUS.md](SANITY-PORT-STATUS.md). Do not run a production import or expose a token as part of the schema-only checkpoint.

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
- A code push to `main` deploys without waiting for the checks (decision 14). Use a branch and a pull request for code.
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
