# Forró Budapest website

[![Check](https://github.com/davidpalfi/forro-bp-website/actions/workflows/check.yml/badge.svg)](https://github.com/davidpalfi/forro-bp-website/actions/workflows/check.yml)

The website of the Forró Budapest dance community, with the **Budapest Forró Festival** as a section below it, in English and Hungarian. It is built to replace the festival's current Wix site (forrobudapest.com) with a static site that costs nothing to run and that non-technical editors can update themselves, by clicking on the page.

> **Status:** in development. The test site is online and rebuilt from the editor; forrobudapest.com is still served by Wix until launch.

## Features

- **Static public site**: plain HTML built with [Astro](https://astro.build); nothing runs on a server.
- **Two languages**: every page in English and Hungarian (`/en/...`, `/hu/...`), side by side in each entry, with a fallback to the other language when one is missing.
- **Page builder**: editors create pages from blocks (text, images, galleries, people, buttons, columns, video, event calendar, ...) in [Sanity Studio](https://www.sanity.io/studio).
- **Click-to-edit**: a preview of the real page next to the editor; click a text or photo to edit it. Drafts are visible only inside the Studio.
- **Publish rebuilds the site**: a Sanity webhook triggers a new build on Cloudflare.
- **Hard to break**: every field is optional in the code, content problems become warnings instead of failed builds, and unsafe links are dropped.
- **Privacy-friendly**: self-hosted fonts, no trackers, no cookies on the public site.

## How it fits together

```
Editor -> Sanity Studio -> content in Sanity (project 8hc671sk, dataset production)
              |  "Edit on the page"                  |  Publish (webhook)
              v                                      v
   preview Worker (drafts, on request)      static site Worker (rebuilt)
              Cloudflare Workers, built from main by Workers Builds
```

| | Address |
|---|---|
| Editor | https://forro-budapest.sanity.studio |
| Test site | https://forro-bp-website.pdavid92.workers.dev |

## Getting started

Requirements: Node 22.23.4 or newer (see `.node-version`).

```bash
git clone https://github.com/davidpalfi/forro-bp-website.git
cd forro-bp-website
npm ci
npm run dev        # http://localhost:4321
```

The local site is built from the JSON files in `src/content/`, so no Sanity account is needed to run it or the tests. To build from the published Sanity content instead:

```bash
CONTENT_SOURCE=sanity npm run build
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server from the JSON content |
| `npm run build` | Static build into `dist/` (read any `[content-warning]` lines) |
| `npm run check` | The test suite: schema, several test builds, the preview; must pass before a push |
| `npm run studio` | Sanity Studio locally, http://localhost:3333 |
| `npm run preview:edit` | Click-to-edit preview from Sanity drafts, http://localhost:4322 (needs a Viewer token in `.env`, see `.env.example`) |
| `npm run preview:build` | The same preview built for Cloudflare |
| `npm run sanity:import` | Import the JSON content into Sanity (creates missing documents only) |

More commands and how to check changes in a browser: [docs/HANDOFF.md](docs/HANDOFF.md).

## Project structure

```
src/
  pages/         routes: [lang]/ (community), [lang]/festival/ (festival), 404, root redirect
  components/    blocks, banners, people cards, responsive pictures
  layouts/       Base.astro: head, header, menu, language switch, footer
  lib/           content loading and helpers, fixed wording (i18n.ts), preview code
  content/       the original content as JSON (import source and test content)
  styles/        global.css
studio/          Sanity Studio: schemas and editor configuration
scripts/         test suite, image resizing, Sanity import, deploy checks
public/          uploaded photos, icons
docs/            project documentation (below)
```

## Deployment

Two Cloudflare Workers are built from `main` on every push:

- `forro-bp-website`: the static site (`wrangler.site.jsonc`), also rebuilt when content is published.
- `forro-budapest-preview`: the click-to-edit preview (`wrangler.jsonc`), server-rendered and locked to the Studio.

The Studio is deployed to Sanity by GitHub Actions when `studio/` changes on `main`. Tokens live only in Cloudflare and GitHub secrets. Setup, step by step: [docs/HOSTING.md](docs/HOSTING.md).

## Documentation

| Document | Contents |
|---|---|
| [docs/HANDOFF.md](docs/HANDOFF.md) | Start here: current state, how work is done, commands, checks |
| [docs/backlog.json](docs/backlog.json) | Open work as tickets: status, priority, milestone, acceptance criteria |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Why it is built this way |
| [docs/SPEC.md](docs/SPEC.md) | What the site does; acceptance criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Code map, rules and recipes for changes |
| [docs/USER-NEEDS.md](docs/USER-NEEDS.md) | Who the site is for |
| [docs/EDITING-GUIDE.md](docs/EDITING-GUIDE.md) | Plain-language guide for content editors |
| [CLAUDE.md](CLAUDE.md) | Rules for AI agents working in this repository |

## Contributing

Run `npm run check` before pushing; it must pass. Structural changes record their reasoning in `docs/DECISIONS.md` and changed behaviour in `docs/SPEC.md` in the same commit. Dependencies are pinned to exact versions; upgrade them deliberately.
