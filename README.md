# Forró Budapest website

One website for the Forró Budapest community, with the Budapest Forró Festival as a section below it, in English and Hungarian. It is built to replace the current Wix site, with an editor the admin can use herself.

**New here (person or agent)?** Read [docs/HANDOFF.md](docs/HANDOFF.md) first, then [docs/BACKLOG.md](docs/BACKLOG.md).

## Where it stands (2026-11-23)

| Where | What it is |
|---|---|
| `main` | **The site.** Content in Sanity, edited in Sanity Studio, including **click-to-edit**: the real page next to the editor, click a text or photo to edit it. Online: preview https://forro-budapest-preview.pdavid92.workers.dev, test site https://forro-bp-website.pdavid92.workers.dev ([docs/HOSTING.md](docs/HOSTING.md)). Not yet sent to the admin |
| tag `pages-cms-poc` | The first proof of concept (Pages CMS forms, GitHub Pages), kept for reference. Retired 2026-11-23 |

The live forrobudapest.com is still Wix. Nothing here changes it until the domain is moved at launch.

```
Admin -> Sanity Studio (forro-budapest.sanity.studio) -> content in Sanity
                 |  "Edit on the page"                        |
                 v                                            v
         preview: drafts, on request              npm run build -> static site
         (online, Cloudflare)                     (online, rebuilt on Publish)
```

## Next step: send it to the admin for review (online since 2026-11-23; sending on hold)

Goal: the admin signs in, edits the real content herself (on the page on a computer, with the forms on her phone), publishes, sees the result on a test address, and sends her feedback. Everything goes on new, unlisted addresses with "hide from Google" on; Wix and the `main` site stay as they are.

**What she will get**
- The editor at `forro-budapest.sanity.studio`, with her own account.
- **Edit on the page** working from her own computer, on the online preview.
- A test version of the public site, https://forro-bp-website.pdavid92.workers.dev, that updates a few minutes after she clicks **Publish**.

**1. Dávid: accounts and decisions (about 30 minutes)**
- [x] Check Sanity's free plan in sanity.io/manage: how many members and which roles are free. She needs a role that can edit and publish. Done 2026-11-18: Free plan, both Administrators (`docs/DECISIONS.md` S10).
- [x] Create a free Cloudflare account (done 2026-11-18, signed in with GitHub) (recommended host for the preview and the test site). Connect it to the GitHub repository when the agent asks.
- [x] Agree how the preview is protected: Sanity's preview lock (chosen 2026-11-18).
- [x] (Moved to step 3.) Test the invite on yourself.
- [x] Polish item A first: yes (chosen 2026-11-18; built).
- [x] Create the two Cloudflare Workers and the Sanity webhook ([docs/HOSTING.md](docs/HOSTING.md)). Done 2026-11-23.

**2. Agent / maintainer: code** (done)
- [x] Make the preview run on Cloudflare. The main work: Cloudflare's servers cannot read project files the way a laptop can, so in preview everything must come from Sanity (today `src/lib/content.ts` and `src/lib/from-json.ts` read files with `node:fs`).
- [x] Add the preview lock. The Viewer token goes in Cloudflare's secret settings (`docs/HOSTING.md` step 1), never in the repository.
- [x] No page reload after an edit (polish A).
- [x] Test site: build from Sanity on Cloudflare, plus a Sanity webhook so **Publish** rebuilds it. "Hide from Google" stays on.
- [x] Point the Studio at the online preview (`studio/.env.production`) and deploy it (`npm run studio:deploy`). Done 2026-11-23.
- [x] Admin guide (`docs/EDITING-GUIDE.md`) has the real addresses. Its short maintainer note at the top is removed in the copy sent to her.
- [x] Run through it on a computer (Dávid, Safari, 2026-11-23): edit on the page (drafts show, no reload, 2-3 s delay), publish, test site rebuilds. `npm run check` passes.

**Before sending (agreed 2026-11-23):** a more mature version first: polish how the site looks, then decide on the click-to-edit polish (`docs/BACKLOG.md`, top).

**3. Dávid: send it, when you are ready** (backlog item 13a)
- [ ] Try the forms on your phone once (sign in at forro-budapest.sanity.studio, change a text, publish).
- [ ] Test the invite on yourself (second e-mail address, accept on a phone).
- [ ] Ask the agent for a clean copy of the guide (without the maintainer note).
- [ ] Invite her in sanity.io/manage > Members, role Administrator.
- [ ] Send her the guide, https://forro-budapest.sanity.studio and https://forro-bp-website.pdavid92.workers.dev. Ask her to change things and write down what is unclear.

**Good to know before sending**
- Her edits are real: what she publishes is the actual content that launch will use. Nothing reaches forrobudapest.com until the domain is switched.
- Most photos and bios are still placeholders; replacing them is a good first task for her.
- Click-to-edit is for a computer; on a phone she uses the forms.

After her review: the remaining click-to-edit polish (B-G in `docs/BACKLOG.md`), her design corrections, real content, then launch (`docs/GO-LIVE-CHECKLIST.md`).

## Run it on your computer

Needs Node 22.23.4 or newer. Run every command from this folder (`cd ~/src/forro-budapest-site`).

```
npm ci                    # once, and after pulling changes to package-lock.json
npm run dev               # the site from the JSON files, http://localhost:4321
CONTENT_SOURCE=sanity npm run build   # the site from the published content in Sanity
npm run check             # the test suite; must pass after any code change

npm run preview:edit      # click-to-edit preview from Sanity drafts, http://localhost:4322
npm run preview:build     # the same preview built for Cloudflare (Cloudflare runs this itself)
npm run studio            # Sanity Studio on this computer, http://localhost:3333
```

Click-to-edit on your computer: run `preview:edit` and `studio` in two terminals, open http://localhost:3333, choose **Edit on the page**. The preview needs a Viewer token in a `.env` file in this folder (see `.env.example`; the file is ignored by git, never commit it).

Sanity commands (need `npm run sanity:login` once): `npm run studio:deploy`, `npm run sanity:import` (creates missing documents only), `npm run sanity:import-replace` (overwrites the imported documents; only before the admin starts editing). Details: `docs/HANDOFF.md`, "Commands".

## Documentation

| File | For | What it holds |
|---|---|---|
| `docs/HANDOFF.md` | Anyone picking the project up | Current state, commands, how to check things |
| `docs/BACKLOG.md` | Anyone deciding what to do next | The next task in detail, everything else by priority |
| `docs/SANITY-PORT-STATUS.md` | Anyone working on the Sanity version | What is built and verified |
| `docs/DECISIONS.md` | Anyone questioning a choice | Why it is built this way (S1-S9 for Sanity), history |
| `docs/SPEC.md` | Anyone changing behaviour | Pages, content, rules; section 11 for Sanity, acceptance criteria |
| `docs/ARCHITECTURE.md` | Anyone changing code | Code map, the preview, rules, recipes |
| `docs/USER-NEEDS.md` | Anyone judging whether the design fits | Who the users are, what is known versus assumed |
| `docs/EDITING-GUIDE.md` | The admin (Sanity) | Plain-language how-to; finish before sending |
| `docs/HOSTING.md` | Dávid | Click by click: the Cloudflare preview, test site and rebuild on Publish |
| `docs/GO-LIVE-CHECKLIST.md` | Dávid and the maintainer | Steps up to replacing Wix |
| `EDITING-GUIDE.md` | The old Pages CMS proof of concept (tag `pages-cms-poc`) | Historical |
| `CLAUDE.md` | Claude sessions in this repo | Rules for safe changes |

## Addresses on the site

| Address | Page |
|---|---|
| `/` | Sends the visitor to `/hu/` or `/en/` |
| `/en/`, `/hu/` | Community home |
| `/en/<address>/` | Community pages made in the Studio (for example About us, Contact) |
| `/en/festival/`, `/hu/festival/` | Festival home |
| `/en/festival/<address>/` | Festival pages made in the Studio (Program, Teachers, Artists, Location, ...) |

## Built-in safety

- Every field is optional in the code. Missing or odd values fall back to sensible defaults.
- A missing translation shows the other language instead of a gap.
- Links must be `https://`, `mailto:` or a page of the site; anything else is dropped.
- Problems in content become `[content-warning]` lines and **never stop publishing**. Only an unreachable or empty Sanity stops a build, so the previous site stays online.
- Drafts never reach the public site; the click-to-edit parts exist only in the preview (`npm run check` proves both).
- Versions are pinned, so the site does not change by itself.

## Moving the domain from Wix (at launch)

1. Find out where the domain is registered. If it is at Wix, transfer it to an independent registrar first.
2. Do not cancel the Wix plan until the new site is live and the domain points to it.
3. Add the custom domain at the host and update the DNS records as instructed.
4. Redirect the old addresses (list in `docs/HANDOFF.md`).
5. Turn off "Hide the site from Google" in Site settings.

## Dependencies and what they cost

| Piece | Role | Cost |
|---|---|---|
| Sanity | Content and the editor (Studio hosted by Sanity) | Free plan; check its limits (step 1 above) |
| Cloudflare | Online preview and the test site (`docs/HOSTING.md`) | Free plan |
| GitHub | Stores the code | Free |
| npm packages (Astro, Sanity, sharp, fonts, ...) | Build tools, editor, fonts, pinned to exact versions | Free |
| Domain | forrobudapest.com | Around 10-15 EUR a year |
