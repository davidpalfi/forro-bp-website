# Forró Budapest website

One website for the Forró Budapest community, with the Budapest Forró Festival as a section below it, in English and Hungarian. It is built to replace the current Wix site, with an editor the admin can use herself.

**New here (person or agent)?** Read [docs/HANDOFF.md](docs/HANDOFF.md) first, then [docs/BACKLOG.md](docs/BACKLOG.md).

## Where it stands (2026-11-18)

| Branch | What it is |
|---|---|
| `main` | The first proof of concept (Pages CMS forms, GitHub Pages), live at davidpalfi.github.io/forro-bp-website. Kept unchanged as the fallback |
| `feature/sanity` | **The current work.** Content in Sanity, edited in Sanity Studio, including **click-to-edit**: the real page next to the editor, click a text or photo to edit it. Works on Dávid's computer and he approved it. **Not online yet** |

The live forrobudapest.com is still Wix. Nothing here changes it until the domain is moved at launch.

```
Admin -> Sanity Studio (forro-budapest.sanity.studio) -> content in Sanity
                 |  "Edit on the page"                        |
                 v                                            v
         preview: drafts, on request              npm run build -> static site
         (now: Dávid's computer; next: online)    (next: online, rebuilt on Publish)
```

## Next step: go live for the admin's review

Goal: the admin signs in, edits the real content herself (on the page on a computer, with the forms on her phone), publishes, sees the result on a test address, and sends her feedback. Everything goes on new, unlisted addresses with "hide from Google" on; Wix and the `main` site stay as they are.

**What she will get**
- The editor at `forro-budapest.sanity.studio`, with her own account.
- **Edit on the page** working from her own computer, on the online preview.
- A test version of the public site (for example `forro-budapest.pages.dev`) that updates a few minutes after she clicks **Publish**.

**1. Dávid: accounts and decisions (about 30 minutes)**
- [ ] Check Sanity's free plan in sanity.io/manage: how many members and which roles are free. She needs a role that can edit and publish. Note the findings (date, numbers) in `docs/DECISIONS.md` or tell the agent.
- [ ] Create a free Cloudflare account (recommended host for the preview and the test site). Connect it to the GitHub repository when the agent asks.
- [ ] Agree how the preview is protected. Recommended: Sanity's preview lock, so only people signed in to the Studio can see drafts, with nothing extra to log into.
- [ ] Test the invite on yourself: invite a second e-mail address of yours, sign in on a phone, and check it is simple enough for her.
- [ ] Decide whether to do polish item A first (no page reload after each edit, about 1-2 hours; `docs/BACKLOG.md`). Recommended: it makes a better first impression.

**2. Agent / maintainer: code (roughly a day, mostly the first item)**
- [ ] Make the preview run on Cloudflare. The main work: Cloudflare's servers cannot read project files the way a laptop can, so in preview everything must come from Sanity (today `src/lib/content.ts` and `src/lib/from-json.ts` read files with `node:fs`).
- [ ] Add the preview lock (`@sanity/preview-url-secret` is installed) and put the Viewer token in Cloudflare's secret settings, never in the repository.
- [ ] Test site: build from Sanity (`CONTENT_SOURCE=sanity`) on Cloudflare, plus a Sanity webhook so **Publish** rebuilds it. "Hide from Google" stays on.
- [ ] Point the Studio at the online preview (`SANITY_STUDIO_PREVIEW_URL`) and deploy it again (`npm run studio:deploy`). **Only then**: before that, the deployed Studio would point her at `localhost`.
- [ ] Finish the admin guide (`docs/EDITING-GUIDE.md`) with the real addresses; remove the "not ready" notes.
- [ ] Run through it: sign in, edit on the page, publish, see the test site update, on desktop and phone. `npm run check` passes.

**3. Dávid: send it**
- [ ] Invite her in sanity.io/manage > Members.
- [ ] Send her the guide and the two addresses. Ask her to change things and write down what is unclear.

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
| `docs/GO-LIVE-CHECKLIST.md` | Dávid and the maintainer | Steps up to replacing Wix |
| `EDITING-GUIDE.md` | The old Pages CMS proof of concept | Historical |
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
| Cloudflare (planned) | Online preview and the public site | Free plan |
| GitHub | Stores the code | Free |
| npm packages (Astro, Sanity, sharp, fonts, ...) | Build tools, editor, fonts, pinned to exact versions | Free |
| Domain | forrobudapest.com | Around 10-15 EUR a year |
