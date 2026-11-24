# User needs

What the design decisions rest on, and how well each need is known. Sources: the owner's conversations (including the 2026-11-15 Sanity planning discussion), two things relayed from the admin, and a read of every page of the current Wix site on 2026-11-11 (English page text, phone screenshots of both languages, desktop screenshots of English). **No direct interview with the admin, analytics, or visitor research exist.** Do not treat "assumed" items as findings. When a need is confirmed or corrected, change its status here and update the decisions that depend on it.

Status labels: **Stated** (the owner said it), **Relayed** (the owner reported the admin saying it), **Observed** (seen on the existing site), **Assumed** (a reasonable guess, unchecked).

## Who the users are

| User | What is known |
|---|---|
| **Admin** | Owns the current Wix site and made its design. Not technical. Runs regular classes in the community. Wants to update the site herself. Writes both English and Hungarian herself. Has no GitHub account and should not need one to edit the site. (Stated) |
| **Owner / maintainer** | Software engineer in the community, new to building websites. A few other technical people could help long term. Uses Claude for development. (Stated) |
| **Visitor** | Dancers from Hungary and abroad. Nothing measured. |

## Needs

### Admin and owner

| ID | Need | Status | Drives |
|---|---|---|---|
| N1 | The admin updates content herself, without a developer | Stated (top priority) | Editor choice (Sanity with click-to-edit, S3, S8) and her trial (`backlog.json` FB-16) |
| N2 | No subscription; content may live with a provider if the service meets the need and remains free to use | Stated (updated 2026-11-15) | Sanity and Cloudflare free plans (S10, S11) |
| N3 | Robust and hard for her to break | Stated | Lenient code, warnings do not block (8) |
| N4 | One community site, with the festival as a section below it | Stated; the admin agreed (Relayed) | Two levels (4) |
| N5 | The community site uses the festival site's design | Relayed ("a good idea") | The Wix look is copied (10) |
| N6 | English and Hungarian | Stated; Observed on the Wix site | Two languages (5) |
| N7 | The community level starts small: a home page, a few pages, an event calendar | Stated (empty at first; grown by Dávid 2026-11-23/24) | S14-S17; what else it shows is for the admin (FB-22) |
| N8 | A working copy online to show her before anything replaces Wix | Stated | Preview and test site on Cloudflare (S11) |
| N9 | Detached forms are unintuitive for the admin; editing on the page is preferred | Stated by owner, 2026-11-15; confirmed 2026-11-18 when the Sanity forms alone felt the same | Click-to-edit (S8, S9); still to be validated with the admin |
| N10 | Old addresses keep working when the domain moves | Assumed | Redirect list (FB-32) |
| N11 | Someone technical learns of a failed build | Assumed | Open question (FB-28) |

### Visitors

| ID | Need | Status | Drives |
|---|---|---|---|
| V1 | See what the festival is and when | Observed | Festival home: banner, date, intro, counts line |
| V2 | See the program | Observed (published as images) | Program page of Image blocks |
| V3 | See the teachers and the artists | Observed (two pages, six people each) | People in two groups |
| V4 | Buy tickets | Observed (external ticket link) | Ticket button; no sales in scope |
| V5 | Find the venue and the code of conduct | Observed | Text pages with photos |
| V6 | Read it in their language and switch easily | Observed (EN/HU switcher) | Language in the address, switcher on every page |
| V7 | Use it on a phone, arriving from a social link | Assumed | Phone-first layout, sharing image |
| V8 | Fast pages, no cookie banner | Assumed | Self-hosted fonts, minimal outside requests (10) |

## What the Wix site contains (Observed, 2026-11-11)

- Pages: Home, Program, Teachers, Artists, Location, Code of Conduct. English at the root, Hungarian under `/hu/`.
- Home: a banner photo with the logo (an aerial view on phones, people dancing on desktop), a ticket button, the dates, three paragraphs of intro, a line of counts ("14 Workshops | 4 Bands | ..."), a Code of Conduct button.
- Program: a heading and schedule graphics, in English on both language versions.
- Teachers and Artists: dark cards on a red page, two side by side on desktop; for each person a photo, a role label (teachers only), a name, a bio of a few paragraphs and an Instagram link.
- Location: a banner photo, then a cream page titled "Venue" with two short sections, an address block, a small photo gallery.
- No forms, no embedded map, no members area. (A banner video on the home page was noticed later, 2026-11-24: S21.) Tickets are sold on an external platform.
- The Hungarian menu contains a stray "New Page" entry.

## What this means for the design

- N1 to N3 decide the stack.
- The festival section mirrors what the admin actually publishes on Wix, so its content rests on observation. The community level rests on Dávid's choices so far; what it should hold is still to ask her.
- The site is built for a handful of updates around festival time, plus the monthly event calendar.

## Still to ask

The open questions for the admin are tickets in `backlog.json`: her trial (FB-16), design and fonts (FB-17), the community level (FB-22), editor options (FB-23), and the launch practicalities (FB-26 to FB-29, FB-36).
