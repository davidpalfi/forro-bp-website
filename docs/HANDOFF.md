# Handoff: start here

For anyone (person or agent) picking the project up. Read this, then `backlog.json`. Before a structural change also read `DECISIONS.md`, `SPEC.md` and `ARCHITECTURE.md`. `CLAUDE.md` has the rules for a Claude session. Keep this file about the present: replace what is no longer true instead of adding a dated section.

## The documents

| File | For | Holds |
|---|---|---|
| `README.md` | Anyone | What it is, how to run it |
| `docs/HANDOFF.md` | Anyone picking it up | Current state, how we work, commands, how to check things |
| `docs/backlog.json` | Deciding what to do next | Every open task and decision as a ticket (status, priority, milestone, owner, acceptance criteria); rules at the top |
| `docs/DECISIONS.md` | Questioning a choice | Why it is built this way |
| `docs/SPEC.md` | Changing behaviour | What the site does; acceptance criteria |
| `docs/ARCHITECTURE.md` | Changing code | Code map, the preview, rules, recipes |
| `docs/USER-NEEDS.md` | Judging whether the design fits | Who the users are; what is known versus assumed |
| `docs/HOSTING.md` | Dávid | Click by click: the Cloudflare and Sanity setup (done; for rebuilding or troubleshooting) |
| `docs/EDITING-GUIDE.md` | The admin | Plain-language how-to for the Studio |

## Where it stands (2026-11-24)

| Part | State |
|---|---|
| Live forrobudapest.com | Still Wix. Nothing here changes it until the domain is moved at launch (milestone M4 in `backlog.json`) |
| `main` | The site: Astro, content from Sanity (project `8hc671sk`, dataset `production`). Every push rebuilds both Cloudflare Workers. The old Pages CMS proof of concept is the tag `pages-cms-poc` |
| Studio | https://forro-budapest.sanity.studio, deployed by GitHub when `studio/` changes on `main` (S19). Content imported 2026-11-18 and edited since by Dávid |
| Preview (click-to-edit) | https://forro-budapest-preview.pdavid92.workers.dev, locked (drafts only inside the Studio), no reload after an edit. Verified by Dávid in Safari 2026-11-23 |
| Test site | https://forro-bp-website.pdavid92.workers.dev, rebuilt on Publish (Sanity webhook → Workers Builds deploy hook), "Hide from Google" on |
| Admin | Has not seen it yet. Sending is on hold until Dávid finds it mature enough (milestones M1-M2 in `backlog.json`; FB-13 sends it) |
| Content | Mostly placeholders (photos, bios, logos); replaced by the admin later (FB-18, FB-19) |

## How we work

- **Dávid sends what bothers him** on the test site, often as screenshots (Wix for reference, the test site, the Studio), sometimes in Hungarian. The agent fixes it, runs `npm run check`, looks at it at phone and desktop width, and pushes straight to `main` (revert with `git revert` if something breaks; he sometimes changes his mind). Before a design change he is unsure about, show a mock-up (screenshots of a local build) instead of pushing.
- **Start work only on a clear go.** When he is planning or asking, answer and plan only.
- **Experiments** that need trying before `main` go on `feature/<what-it-does>` (`CLAUDE.md`). The online preview builds only `main`, so a branch is tried on Dávid's computer (`npm run preview:edit` + `npm run studio`).
- **Instructions for Dávid**: short, click by click, with direct links; he sometimes works from a phone. Run `npm run` commands from the project folder (`cd ~/src/forro-budapest-site`).
- **After a Studio change**, tell him to reload the Studio tab about two minutes after the push. The deploy run is at github.com/davidpalfi/forro-bp-website/actions (public API: `curl https://api.github.com/repos/davidpalfi/forro-bp-website/actions/runs`).
- **Record as you go**: a new or changed decision in `DECISIONS.md`, changed behaviour in `SPEC.md`, the ticket deleted from `backlog.json` when done, all in the same change. Something new to do becomes a ticket there, not a note in another file.
- **Finding work**: tickets with status `todo`, by milestone and then priority. `proposed` ones need Dávid's go. For a quick list: `node -e "for (const t of require('./docs/backlog.json').tickets) if (t.status === 'todo') console.log(t.id, t.milestone, t.priority, t.owner, t.title)"`

## What a cloud session can and cannot reach

- **sanity.io and the `workers.dev` sites are blocked.** The agent cannot read or change the content. For content, give Dávid click-by-click Studio steps, with menu paths as in `docs/EDITING-GUIDE.md` (e.g. "Community → Pages").
- **To check a change visually**, build locally with test content: `CONTENT_SOURCE=file:<some.ndjson> npm run build`, made from `scripts/lib/sanity-fixture.mjs` plus the documents you need, then serve `dist/` and screenshot with Playwright.
- **Screenshots from Dávid's phone or Mac carry a colour profile** (Display P3): convert to sRGB before measuring colours (PIL `ImageCms`), or the values come out wrong.

## Secrets

Never read out, print, commit or ask for a token. Project id and dataset name are configuration, not secrets.

| Secret | Where it lives |
|---|---|
| `SANITY_VIEWER_TOKEN` (preview) | Cloudflare secret on `forro-budapest-preview`; Dávid's own copy in his git-ignored `.env` for `npm run preview:edit` |
| `SANITY_AUTH_TOKEN` ("Deploy Studio" only) | GitHub repository secret, used by `.github/workflows/studio-deploy.yml` |
| Deploy hook address | Only in the Sanity webhook "Rebuild test site" |

## Commands

Needs Node 22.23.4 or newer (`.node-version`).

```
npm ci                         # once (exact versions from the lockfile)
npm run dev                    # the site from the JSON files, http://localhost:4321
npm run build                  # builds dist/ ; read any [content-warning] lines
CONTENT_SOURCE=sanity npm run build   # from the published content in Sanity
npm run check                  # the test suite, about 20-40 seconds; must pass after any code change
npm run preview:edit           # click-to-edit preview, http://localhost:4322 (drafts; needs .env, see .env.example)
npm run preview:build          # the same preview built for Cloudflare; preview:local runs it at :4323
npm run studio                 # Sanity Studio, http://localhost:3333
npm run studio:build
npm run studio:deploy          # normally not needed: GitHub deploys the Studio
npm run sanity:login           # sign in to Sanity on this computer (once)
npm run sanity:import-file     # write sanity-import/ from src/content; sends nothing
npm run sanity:import          # import missing documents into Sanity (never overwrites)
npm run sanity:import-replace  # overwrite the imported documents: only before the admin starts editing
```

Build for a sub-path locally: `SITE_URL=https://x.github.io SITE_BASE=/repo npm run build`. Astro 7 runs one dev server per project unless `--ignore-lock`; stop a stray preview with `lsof -ti:4322 | xargs kill`.

## How to check things

**Automated:** `npm run check`. A code change is not done until it passes. It cannot check the menu button, the language redirect, phone layout, or anything about the live Studio or hosting.

**In a browser:** build, serve `dist/` (`python3 -m http.server 8777 --directory dist`), and look at these at 390 and 1280 px wide: `/en/`, `/hu/festival/`, `/en/festival/program/`, `/hu/festival/teachers/`, `/en/festival/artists/`, `/en/festival/location/`, `/en/festival/code-of-conduct/`, `/404.html`. Check:
- no horizontal scrolling (`document.documentElement.scrollWidth > window.innerWidth` is false) and no console errors;
- no request leaves the site except to `cdn.sanity.io` (and YouTube/Vimeo where a Video block is used);
- at 390 px the menu button opens the full-screen menu and Escape closes it;
- `/` lands on `/hu/` in a browser set to Hungarian, on the main language otherwise, and still redirects with JavaScript off;
- the language switch on an inner page leads to the same page in the other language.

Playwright with Chromium does all of this in a script.

## Cloudflare quirks

- **Retry build** rebuilds the same commit; to build after changing settings, push a change.
- Ignore Cloudflare's suggestion (and its pull request) to "update wrangler.jsonc name" for the test site: it reads the preview's file. The test site uses `wrangler.site.jsonc`.
- Editing outlines also show on the preview opened outside the Studio (on hover only); Dávid is fine with that.

## Known limits

- The program is images: not readable by screen readers or search engines unless a Text block is added.
- `npm run check` runs on GitHub after a push, but Cloudflare deploys without waiting for it: run it before pushing.
- No sitemap, analytics or forms.
- Not tested: the invited-editor sign-in (FB-11), the webhook after the Growth trial ends (FB-15), browsers other than Chromium and Safari.
