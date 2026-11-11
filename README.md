# Festival site (prototype)

**New here (person or agent)?** Read `docs/HANDOFF.md` first.

## Documentation

| File | For | What it holds |
|---|---|---|
| `docs/HANDOFF.md` | Anyone picking the project up | Status, next steps in order, commands, how to check things, known issues |
| `docs/USER-NEEDS.md` | Anyone judging whether the design fits | Who the users are, what is known vs assumed about their needs, what to ask them |
| `docs/SPEC.md` | Anyone changing behaviour | What the site does: pages, content model, rules, acceptance criteria |
| `docs/ARCHITECTURE.md` | Anyone changing code | Code map, data flow, Astro 7 notes, recipes for common changes |
| `docs/DECISIONS.md` | Anyone questioning a choice | Why it is built this way, unverified assumptions, test record |
| `EDITING-GUIDE.md` | The person editing the site | Plain-language how-to |
| `CLAUDE.md` | Claude sessions editing this repo | Rules for safe content changes |

Run `npm run check` after any change.

A static website: Astro builds plain HTML from content files in this repo. No database, no server, nothing running that can be hacked or go down. Editors change the content through forms (Pages CMS), which save the files back to this repo; the host then rebuilds the site.

```
Editor forms (Pages CMS)  ->  files in src/content  ->  GitHub repo  ->  GitHub Pages (or Cloudflare Pages) builds and serves
```

Everything in the middle is plain text files you own. Any of the outer pieces can be swapped without touching the site.

## Run it on your computer

Needs Node 22.23.4 or newer.

```
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # builds the site into dist/
```

## Where content lives

| Folder or file | What it is | Editor form |
|---|---|---|
| `src/content/settings/home.json` | Home page texts and main photo | Pages > Home page |
| `src/content/settings/site.json` | Name, contact, ticket button, wording, "hide from Google" switch | Site settings |
| `src/content/events/` | One file per program item | Program |
| `src/content/people/` | One file per teacher, performer or organizer | People |
| `src/content/links/` | Video, photo and social links | Videos, photos and social links |
| `src/content/pages/` | Free-form text pages (location, rules, ...), each gets its own address | Pages > Text pages |
| `public/uploads/` | Uploaded photos. The build makes web-sized copies, so any size can be uploaded | (media picker) |
| `.pages.yml` | Describes the forms | |
| `src/content.config.ts` | Describes the content to the site | |

Adding a new field means adding it in `.pages.yml` (the form), `src/content.config.ts` (the shape) and the page that shows it.

## Built-in safety

The site is built so that bad content cannot take it down:

- Every field is optional in the code. Missing or empty values fall back to sensible defaults.
- An event without a valid date is skipped, with a warning in the build log.
- A deleted teacher that a program item still points to is ignored.
- Links must be normal `https://` (or `mailto:`) links; anything else is dropped.
- A photo path that no longer exists is left out instead of showing a broken image.
- Past program items hide themselves in the visitor's browser, so the site never shows old events even if it was not rebuilt.
- Every push runs `npm run check` and the build first; if either fails nothing is published and the previous version stays online (confirm on the first failed run, and make sure failure emails go to a technical person).
- Versions are pinned (Node, Astro, sharp, lockfile), so the site does not change by itself.

## Put it online: GitHub Pages (test setup)

1. Create an empty repository on GitHub (public is fine for the test) and push this folder (`git remote add origin <url>`, `git push -u origin main`).
2. In the repository: Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. Open the Actions tab and watch "Deploy to GitHub Pages". When it is green, the site is at `https://<user>.github.io/<repo>/`. The run's summary page lists any `[content-warning]` lines.
4. Custom domain later: put the domain on one line in `public/CNAME` and set it under Settings > Pages. The workflow then builds for the root address.

Local build for a sub-path: `SITE_URL=https://<user>.github.io SITE_BASE=/<repo> npm run build`.

## Put it online: Cloudflare Pages (production option)

1. **GitHub:** create a repository (private is fine) and push this folder.
2. **Cloudflare Pages:** create a project from that repository.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `NODE_VERSION` = `22.23.4`, `SITE_URL` = the real address
3. **Pages CMS:** open pagescms.org, sign in with GitHub, install its GitHub App on the repository, then invite the editor by email under the repository's collaborators (see pagescms.org/docs/configuration/collaborators). Invited editors do not need a GitHub account.

Every saved change in the editor becomes a commit; the host rebuilds and publishes it, normally within a couple of minutes.

## First test (do this before trusting the setup)

I wrote `.pages.yml` from the Pages CMS documentation but could not run the live tool. Before building real content:

1. Connect the repo to Pages CMS and check that all five sections appear with the right fields.
2. Invite the future editor by email and have her sign in on her own phone. Check how the invitation and sign-in actually work for someone without a GitHub account. This is the part most likely to cause friction.
3. Have her add a program item with a teacher picked from the list, upload a phone photo, and save.
4. Confirm the change appears on the live site, and that the picked teacher's name shows.

While you do this, also check the other unverified assumptions listed in `docs/DECISIONS.md` (for example, what the first saved person and program files actually contain) and fix the code or config where they differ.

If step 2 is a struggle, or the forms do not behave as described, stop there. The content files do not change, so another editing tool can replace Pages CMS.

## Moving the domain from Wix

1. Find out where the domain is registered. If it is at Wix, transfer it to an independent registrar first (Cloudflare Registrar, for example).
2. Do not cancel the Wix plan until the new site is live and the domain points to it. A free Wix plan cannot keep a custom domain.
3. In the host (GitHub Pages: Settings > Pages, plus `public/CNAME`; Cloudflare Pages: Custom domains), add the custom domain and update the DNS records as instructed.
4. Keep the old page addresses where possible, or add redirects, so existing links and search results keep working.
5. Turn off the "hide from Google" switch in Site settings when the site goes live.

## Dependencies and what they cost

| Piece | Role | If it disappears |
|---|---|---|
| GitHub | Stores the files | Any Git host works; the folder is a normal Git repo |
| GitHub Pages / Cloudflare Pages | Builds and hosts the site (free) | Any static host works; set `SITE_URL` |
| Pages CMS | Editor forms (free, open source, can be self-hosted) | Replace with another editing tool; content stays as files |
| Domain | Around 10-15 EUR a year | Registrar of your choice |

## Not included yet

- Two languages (for example Hungarian and English). Today it is one language; all wording can be changed under Site settings > Wording.
- A sitemap, forms, and analytics. Add them when they are needed.
- Fonts are system fonts on purpose: nothing loads from third parties. A font can be self-hosted later.
- The design. Colours and spacing are in `src/styles/global.css` (top of the file). A finished design replaces that file and the markup in `src/pages` and `src/components`; the content stays as it is.
