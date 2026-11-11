# Handoff: start here

If you are picking this project up with no other context, read this file first, then `SPEC.md` (what the site does), `DECISIONS.md` (why), and `ARCHITECTURE.md` (how the code is organised). `CLAUDE.md` has the rules for editing content; `EDITING-GUIDE.md` is for the person who edits the site.

## In 60 seconds

- **What:** a static website for a dance festival (Astro). It replaces a Wix site. Content is plain files in this repo; a free editor (Pages CMS) gives the non-technical admin forms to change them; Cloudflare Pages builds and hosts it.
- **What the owner wants, in priority order:** the admin can update it herself; it is robust and hard for her to break; as little dependence on outside providers as possible (leaving Wix is the point). The real content and layout are not decided yet, so this is a base to prototype on. The admin is a designer and will provide her own design later.
- **State:** the prototype is built and its build-level checks pass. It has placeholder content. It is ready to push to GitHub and publish with GitHub Pages (workflow included, not yet run on a real repository). The live editor (Pages CMS) has never been connected to it.
- **First thing to do:** the "first test" below, because the whole plan rests on it.

## Status

Done:
- Pages: home, program, people, text pages, 404 (`SPEC.md` section 3).
- Content model, forgiving schema, safe links, photo resizing, past-event hiding (`SPEC.md` sections 5 and 6).
- Editing forms config (`.pages.yml`), written from the Pages CMS docs.
- Documentation, and `npm run check` (builds the real content and a deliberately broken copy, plus an expected-failure case).
- Checked by hand once: mobile and desktop layout, past-event hiding with and without JavaScript, a rotated oversized phone photo, Hungarian date formatting.

Not done:
- Git repository, GitHub, hosting, domain.
- Connecting Pages CMS and inviting the admin (acceptance criteria AC12 and AC13 in `SPEC.md`).
- Confirming that a failed build leaves the previous version live (AC14).
- The real content, languages and design (`SPEC.md` section 10).
- Accessibility beyond basics; testing in browsers other than Chromium; any analytics, sitemap or forms.

## Next steps, in order

1. **Push to GitHub and publish with GitHub Pages.** The folder is already a Git repo with one commit. Create an empty repository on GitHub (public for the test), add it as `origin`, push `main`, then in the repository open Settings > Pages > Build and deployment > Source and choose **GitHub Actions**. The workflow runs on every push to `main` (watch it under the Actions tab) and the address appears in the deploy job: `https://<user>.github.io/<repo>/`. If it fails, read the run log; the workflow was written from documentation and not yet run. For a real domain: put it in `public/CNAME`, set it under Settings > Pages, and the base becomes `/` automatically.
2. **Optional, for production: Cloudflare Pages** from the same repo: build command `npm run build`, output folder `dist`, environment variable `NODE_VERSION` = `22.23.4`, `SITE_URL` = the real address. Either host works. Check AC14 on a non-production branch by pushing a file with broken JSON and confirming the live site is unchanged. Decide who gets build-failure emails.
3. **Connect Pages CMS** to the repo and walk through `.pages.yml` against reality. Fill in every row of the assumptions table in `DECISIONS.md` (what exactly does it store for photos, references, dates, selects?). Fix the code or config where it differs, and update the table.
4. **Invite the admin by email** and have her sign in on her own phone and add a program item with a teacher and a photo (AC13). If the sign-in is a struggle, stop: the content files stay the same, so another editor can replace Pages CMS (`ARCHITECTURE.md`, "Swap the editing tool").
5. **Ask her the open questions** below, then replace the placeholder content and decide on languages.
6. **Apply her design** (`ARCHITECTURE.md`, "Replace the design with the admin's").
7. **Domain.** Find out where it is registered. Do not cancel the Wix plan until the new site is live and the domain points to it; a free Wix plan cannot keep a custom domain. Keep old page addresses or add redirects. Set `SITE_URL` (or `public/CNAME` on GitHub Pages) and turn `noindex` off in Site settings.

## Questions for the admin

- What kinds of content will the site have: people, program, text pages, galleries, anything else?
- One language or two (Hungarian and English)?
- How often will she update it, and which parts?
- Which Wix features does the current site use (forms, members area, anything else)? The home page showed none, but only the home page was inspected.
- Where is the domain registered, and when does the Wix plan renew?
- Is the festival site separate from, or part of, a wider community site?

## Commands

```
npm install        # once
npm run dev        # preview at http://localhost:4321 (resizes photos first)
npm run build      # builds dist/ ; read any [content-warning] lines
npm run check      # reproducible tests, about 10-40 seconds
```

Needs Node 22.23.4 or newer (`.node-version` pins 22.23.4). Build for a sub-path locally: `SITE_URL=https://x.github.io SITE_BASE=/repo npm run build`.

## How to check things

**Automated:** `npm run check` covers the build, routes, content on the pages, link and image integrity, safe links, broken-content tolerance and the known failure on broken JSON. A change is not done until it passes.

**In a browser (manual):** `npm run check` cannot test the past-event script or the layout. Recipe, using Playwright (preinstalled in Claude's cloud sandbox for Python; elsewhere install it first):

1. To test hiding, temporarily add a past event, for example `src/content/events/2020-01-01-old.json` with `{ "title": "Old", "date": "2020-01-01" }`. Remove it afterwards.
2. `npm run build`, then `cd dist && python3 -m http.server 8777`.
3. Run:

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(390, 844), (1280, 900)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        for path in ["/", "/program/", "/people/", "/location/"]:
            pg.goto(f"http://localhost:8777{path}")
            print(w, path,
                  "visible/total events:", pg.locator("[data-day]:visible").count(), "/", pg.locator("[data-day]").count(),
                  "overflow:", pg.evaluate("document.documentElement.scrollWidth > window.innerWidth"))
        print(w, "errors:", errors)
    # AC9, JavaScript off: nothing hidden
    ctx = b.new_context(java_script_enabled=False)
    pg = ctx.new_page(); pg.goto("http://localhost:8777/program/")
    print("no-JS visible events:", pg.locator("[data-day]:visible").count())
```

With the old event added, the visible count on `/program/` should be one less than the total, and equal to the total without JavaScript; overflow must be `False` and `errors` empty. Take screenshots and look at them too.

## Environment notes (cloud sandbox this was built in)

- npm works; `npm create astro@latest` templates do not (their download is blocked), which is why the project was created by hand. Many websites are unreachable from the shell, and the web-fetch tool only opens addresses it has been given or found by search.
- A Python Playwright and Chromium are preinstalled. The Node project does not depend on them.
- Photos used as placeholders are generated gradients, not real people.
- The working copy was at `/home/claude/festival-site`; a packaged zip of it was sent to the owner.

## Known issues and limits

- Editors cannot supply alt text for photos (all photos are treated as decorative). A fix needs new fields in the forms and the schema.
- One language only (labels are configurable). A second language is not designed.
- References between content are file paths; renaming a person's file unlinks them from program items.
- Two program items with the same title and date would get the same file name (how Pages CMS handles that is unknown).
- Photos in formats other than JPG, PNG or WebP (for example HEIC) are rejected by the editor on purpose.
- The home page's "Coming up" list uses the build date (UTC); the browser removes anything past by the visitor's date. Between a build and midnight, a day-old item can briefly remain in the list.
- No sitemap, analytics, forms, or search.
- Colours, spacing and look are placeholders, not a design.
- The `.pages.yml` forms are untested against the live tool.

## Glossary

- **CMS (content management system):** the editing layer; here, forms that save the content files.
- **Collection:** a folder of similar files (events, people, links, text pages).
- **Build:** turning the content files and code into the finished static pages in `dist/`.
- **Static site:** the finished pages are ready-made files; nothing runs on the server when someone visits.
- **Reference:** a stored link from one content item to another (an event pointing to its teachers).
- **Preview deployment:** a temporary copy of the site built from a branch, for checking a change before it goes live (a hosting feature).
