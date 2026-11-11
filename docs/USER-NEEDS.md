# User needs

What the design decisions rest on, and how well each need is known. Sources: what the owner (a developer in the community) said in conversation, including two things he relayed from the admin, and a read of every page of the current Wix site on 2026-11-11 (text of the English pages, phone screenshots of both languages, desktop screenshots of the English version). **No interview with the admin, no analytics and no visitor research exist.** Do not treat "assumed" items as findings. When a need is confirmed or corrected, change its status here and update the decisions that depend on it.

Status labels: **Stated** (the owner said it), **Relayed** (the owner reported the admin saying it), **Observed** (seen on the existing site), **Assumed** (a reasonable guess, unchecked).

## Who the users are

| User | What is known |
|---|---|
| **Admin** | Owns the current Wix site and made its design. Not technical. Runs regular classes in the community. Wants to update the site herself. Writes both English and Hungarian herself. Has no GitHub account and no paid Claude plan, and should not need either. (Stated) |
| **Owner / maintainer** | Software engineer in the community, new to building websites. A few other technical people could help long term. Uses Claude for development. (Stated) |
| **Visitor** | Dancers from Hungary and abroad. Nothing measured. |

## Needs

### Admin and owner

| ID | Need | Status | Drives |
|---|---|---|---|
| N1 | The admin updates content herself, without a developer | Stated (top priority) | Pages CMS forms (decision 3), EDITING-GUIDE |
| N2 | No subscription and no paid accounts; leaving Wix is about cost | Stated | Static site and free hosting (1, 13), no Claude path for her (3) |
| N3 | Robust and hard for her to break | Stated | Lenient code, warnings do not block (8), no cross-links (7) |
| N4 | One community site, with the festival as a section below it | Stated; the admin agreed (Relayed) | Two levels (4) |
| N5 | The community site uses the festival site's design | Relayed ("a good idea") | The Wix look is copied (10) |
| N6 | English and Hungarian | Stated; Observed on the Wix site | Two languages (5) |
| N7 | The community level stays empty for now | Stated | Empty shell (4) |
| N8 | A working copy on GitHub Pages to show her | Stated | GitHub Pages proof of concept (13) |
| N9 | Editing need not feel like Wix, only be doable by her | Stated | Forms instead of a visual page editor |
| N10 | Old addresses keep working when the domain moves | Assumed | Redirect list in HANDOFF |
| N11 | Someone technical learns of a failed build | Assumed | Open question: who gets failure emails |

### Visitors

| ID | Need | Status | Drives |
|---|---|---|---|
| V1 | See what the festival is and when | Observed | Festival home: banner, date, intro, counts line |
| V2 | See the program | Observed (published as images) | Program page with uploaded images (6) |
| V3 | See the teachers and the artists | Observed (two pages, six people each) | People in two groups |
| V4 | Buy tickets | Observed (external ticket link) | Ticket button; no sales in scope |
| V5 | Find the venue and the code of conduct | Observed | Text pages with photos |
| V6 | Read it in their language and switch easily | Observed (EN/HU switcher) | Language in the address, switcher on every page |
| V7 | Use it on a phone, arriving from a social link | Assumed | Phone-first layout, sharing image |
| V8 | Fast pages, no cookie banner | Assumed | No third-party requests (10) |

## What the Wix site contains (Observed, 2026-11-11)

- Pages: Home, Program, Teachers, Artists, Location, Code of Conduct. English at the root, Hungarian under `/hu/`.
- Home: a banner photo with the logo (an aerial view on phones, people dancing on desktop), a ticket button, the dates, three paragraphs of intro, a line of counts ("14 Workshops | 4 Bands | ..."), a Code of Conduct button.
- Program: a heading and schedule graphics, in English on both language versions.
- Teachers and Artists: dark cards on a red page, two side by side on desktop; for each person a photo, a role label (teachers only), a name, a bio of a few paragraphs and an Instagram link.
- Location: a banner photo, then a cream page titled "Venue" with two short sections, an address block, a small photo gallery.
- No forms, no embedded video or map, no members area. Tickets are sold on an external platform.
- The Hungarian menu contains a stray "New Page" entry.

## What this means for the design

- N1 to N3 decide the stack. N4 to N8 decide the shape of this revision.
- The festival section now mirrors what the admin actually publishes, so the content types rest on observation, not guesses. The community level rests on nothing yet and is deliberately empty.
- The site is built for a handful of updates around festival time.

## Still to ask

1. **Pages CMS trial (the first test).** Have her sign in on her own phone from the email invitation, add a teacher with a photo and both bios, and replace a program image. Watch, do not help. Where she hesitates is the finding.
2. **Community level.** What should it show: weekly classes, parties, people, links? How often does that change?
3. **Design details.** Which fonts does the Wix design use? Is left-aligned body text acceptable (the Wix site justifies it, which leaves wide gaps on a phone)?
4. **Practicalities.** Where is the domain registered, when does the Wix plan renew, who should own the GitHub repository, who gets failure emails, may the repository be public?
5. **Visitors.** If Wix has visitor statistics, look at device split and top pages before they are lost.
