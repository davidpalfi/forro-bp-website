# Forró Budapest website (proof of concept)

**New here (person or agent)?** Read `docs/HANDOFF.md` first.

One static website for the Forró Budapest community, with the Budapest Forró Festival as a section below it, in English and Hungarian. Astro builds plain HTML from content files in this repo. No database and no server. The admin changes content through forms (Pages CMS), which save the files back to this repo; GitHub then rebuilds and publishes the site.

```
Editor forms (Pages CMS)  ->  files in src/content  ->  GitHub repo  ->  GitHub Pages builds and serves
```

## Documentation

| File | For | What it holds |
|---|---|---|
| `docs/HANDOFF.md` | Anyone picking the project up | Status, what is placeholder, next steps, commands, how to check things |
| `docs/USER-NEEDS.md` | Anyone judging whether the design fits | Who the users are, what is known versus assumed |
| `docs/DECISIONS.md` | Anyone questioning a choice | Why it is built this way, unverified assumptions, history |
| `docs/SPEC.md` | Anyone changing behaviour | Pages, content model, rules, acceptance criteria |
| `docs/ARCHITECTURE.md` | Anyone changing code | Code map, rules, recipes for common changes |
| `EDITING-GUIDE.md` | The person editing the site | Plain-language how-to |
| `CLAUDE.md` | Claude sessions working in this repo | Rules for safe changes |

## Run it on your computer

Needs Node 22.23.4 or newer.

```
npm ci
npm run dev      # live preview at http://localhost:4321
npm run build    # builds the site into dist/
npm run check    # the test suite; run it after any code change
```

## Addresses

| Address | Page |
|---|---|
| `/` | Sends the visitor to `/hu/` or `/en/` |
| `/en/`, `/hu/` | Community home (empty shell for now) |
| `/en/festival/`, `/hu/festival/` | Festival home |
| `.../festival/program/`, `teachers/`, `artists/` | Built-in festival pages |
| `.../festival/<name>/` | Text pages (location, code of conduct, ...) |

## Where content lives

| Folder or file | What it is | Editor form |
|---|---|---|
| `src/content/settings/festival.json` | Festival home, ticket link, program images, headings | Festival > Home page, program and headings |
| `src/content/people/` | One file per teacher or artist | Festival > Teachers and artists |
| `src/content/pages/` | Festival text pages; the file name is the address | Festival > Text pages |
| `src/content/settings/community.json` | Community home page | Community home page |
| `src/content/settings/site.json` | Community name, main language, contact, "hide from Google" | Site settings |
| `public/uploads/` | Uploaded photos; the build makes web-sized copies | (photo picker) |
| `src/lib/i18n.ts` | Short fixed wording (menu words, messages) in both languages | not in the forms |
| `.pages.yml` | Describes the forms | |

Texts that differ by language are stored in pairs (`bio_en`, `bio_hu`). If one is empty, the site shows the other.

## Built-in safety

- Every field is optional in the code. Missing or odd values fall back to sensible defaults.
- A missing translation shows the other language instead of a gap.
- Links must be normal `https://` (or `mailto:`) links; anything else is dropped.
- A photo that no longer exists is left out instead of showing a broken image.
- Problems are reported as `[content-warning]` lines (also on the GitHub run summary) and **never stop publishing**.
- If a build fails outright, nothing is published and the previous version stays online.
- Versions are pinned, so the site does not change by itself.

## Put it online: GitHub Pages

1. Create an empty repository on GitHub (it must be public on the free plan) and push this folder (`git remote add origin <url>`, `git push -u origin main`).
2. In the repository: Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. Open the Actions tab and watch "Deploy to GitHub Pages". When it is green, the site is at `https://<user>.github.io/<repo>/`. The run's summary page lists any content warnings.
4. Custom domain later: put the domain on one line in `public/CNAME` and set it under Settings > Pages. The workflow then builds for the root address.

Any other static host works too: build command `npm run build`, output folder `dist`, `SITE_URL` set to the real address. Cloudflare Pages is the usual choice if the repository should be private.

## First test (do this before trusting the setup)

`.pages.yml` was written from the Pages CMS documentation and has never been run in the live tool.

1. Open pagescms.org, sign in with GitHub, install its GitHub App on the repository, and check that all forms appear with the right fields.
2. Invite the future editor by email (repository collaborators in Pages CMS). Have her sign in on her own phone. This is the step most likely to cause friction.
3. Have her add a teacher with a phone photo and both bios, replace the program image, and save.
4. Confirm the change appears on the live site within a few minutes.
5. Look at what was saved in the files and compare with the assumptions table in `docs/DECISIONS.md`. Fix the code or config where they differ.

If step 2 is a struggle, stop there. The content files do not change, so another editing tool can replace Pages CMS.

## Moving the domain from Wix

1. Find out where the domain is registered. If it is at Wix, transfer it to an independent registrar first.
2. Do not cancel the Wix plan until the new site is live and the domain points to it.
3. Add the custom domain at the host and update the DNS records as instructed.
4. Redirect the old addresses (list in `docs/HANDOFF.md`).
5. Turn off "Hide the site from Google" in Site settings.

## Dependencies and what they cost

| Piece | Role | If it disappears |
|---|---|---|
| GitHub | Stores the files, builds and hosts the site (free) | Any Git host and any static host work |
| Pages CMS | Editor forms (free, open source, can be self-hosted) | Replace with another editing tool; content stays as files |
| npm packages (Astro, sharp, marked, three fonts) | Build tools and fonts, pinned to exact versions | The installed versions keep working; upgrade deliberately |
| Domain | Around 10-15 EUR a year | Registrar of your choice |
