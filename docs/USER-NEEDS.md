# User needs

What the design decisions rest on, and how well each need is known. Written 2026-11-11 from one source only: what the owner (a developer in the community) said in conversation, plus one look at the old Wix home page by the AI agent that built the prototype. **No interviews, analytics or visitor research exist.** Do not treat "assumed" items as findings. When a need is confirmed or corrected, change its status here and update the decisions that depend on it.

Status labels: **Stated** (the owner said it), **Observed** (seen on the existing site), **Assumed** (a reasonable guess, unchecked), **Ask** (an open question, see the end).

## Who the users are

| User | What is known |
|---|---|
| **Admin** | Owns the current Wix site. Not technical. Also a designer, who will provide her own layout. Wants to update the site herself. Has handled the Wix editor before. Will probably use Claude for editing. (all Stated) |
| **Owner / maintainer** | Software engineer in the community, new to building websites. A handful of other technical people in the community could help in the long run, so long-term maintenance is not expected to be a big problem. (Stated) |
| **Visitor** | A person interested in the festival: dancers, possibly newcomers, from the community and beyond. Nothing is known beyond what is below. |

## Needs

### Admin and owner

| ID | Need | Status | Drove |
|---|---|---|---|
| N1 | The admin can update content herself, without a developer | Stated (top priority) | Pages CMS forms (decision 3), fixed collections (4), EDITING-GUIDE |
| N2 | The setup is robust and hard for her to break | Stated ("the more robust and easier to handle and break for her the better") | Forgiving schema (6), build checks, deploy only if checks pass (15), pinned versions (16) |
| N3 | Not depending on outside providers; stop paying the Wix subscription | Stated (the reason for leaving Wix) | Static site (1), plain files (3, 5), swappable host and editor, `SITE_URL`/`SITE_BASE` (17) |
| N4 | The editing does not have to be identical to Wix, only doable by her | Stated | Forms instead of a visual page editor |
| N5 | She can use Claude for edits | Stated | `CLAUDE.md` rules, plain-file content |
| N6 | The final content and layout are not decided; the repo is a base to prototype on | Stated | Placeholder content, configurable wording (12), design replaceable (ARCHITECTURE) |
| N7 | Her own design can be applied later | Stated | Design lives in `global.css` and markup, content separate |
| N8 | Keep the cost near zero | Stated for the Wix fee; free hosting is an inference | Free-tier hosting, free open-source editor |
| N9 | Keep the old domain and links working when moving off Wix | Assumed | README "Moving the domain", redirects advice |
| N10 | Someone technical learns of a failed build | Assumed | Open item: who gets failure emails |

### Visitors

| ID | Need | Status | Drove |
|---|---|---|---|
| V1 | See what the festival is and when it is | Observed (old home page) | Home page hero and intro |
| V2 | See the program | Observed | Program page, program rows |
| V3 | See who teaches and performs | Observed | People page, roles |
| V4 | Buy tickets | Observed (external link) | Ticket button, no sales in scope |
| V5 | Find the location and the rules | Assumed from the old site's content | Text pages (location, code of conduct) |
| V6 | Open promo videos and photos | Stated ("mostly promo photos/videos links and event links") | Links collection |
| V7 | Use it comfortably on a phone, arriving from a social media link | Assumed (typical for community events; not measured) | Mobile-first layout, link-preview tags, fast static pages |
| V8 | Never see old events | Assumed | Past items hide in the browser (7) |
| V9 | Read it in Hungarian and/or English | Not known (the old site is Hungarian) | One language with configurable wording (12); two languages undesigned |
| V10 | Pages load fast and need no cookie banner | Assumed | No third-party requests (9) |

## What this means for the design

- Needs N1 to N3 are the only firm ones, and they decide the stack. Everything about specific pages (V1 to V10) is provisional.
- The page list and content model mirror the old Wix home page and the owner's description. If the admin wants other content (galleries, accommodation, FAQ, registration), add it with the recipes in ARCHITECTURE.
- The site is built for a handful of updates around festival time, not daily editing. If she updates often, revisit the editing experience first.

## Ask (before building real content)

1. **Admin interview (30 minutes, on her phone and laptop).** Show her the old Wix editor and ask her to do her usual task. How often does she update, and what exactly? What annoys her about Wix? What would she be afraid to touch? Which Wix features does the site use beyond the home page?
2. **Content.** Which pages and content types does the real site need? Hungarian, English, or both?
3. **Visitors.** Ask three to five people from the community how they find the festival, what they look up and on what device. Check any analytics the Wix site had (Wix keeps visitor statistics) for device split, top pages and traffic sources.
4. **Practicalities.** Where is the domain registered, when does the Wix plan renew, and who should get failure emails?
5. **Pages CMS trial.** Have her add a program item with a teacher and photo on her own phone (AC13). Watch, do not help. Where she hesitates is the finding.

Record the answers here, change the status labels, and note which decisions changed.
