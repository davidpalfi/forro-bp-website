# How to edit the Forró Budapest website

A guide for the person who updates the site. You need no technical knowledge, and nothing you do here can break the website.

> **For the maintainer, before sending this guide** (updated 2026-11-23): publishing and editing on the page are built and work once the preview and test site are online (`docs/HOSTING.md`). Before sending: redeploy the Studio (`npm run studio:deploy`), test every step yourself in the deployed Studio on a computer and a phone, and fix anything that differs. Then delete this note.

---

## 1. Signing in

1. You will get an email invitation from Sanity. Open it and accept it.
2. Go to **https://forro-budapest.sanity.studio** and sign in with the same Google account or email address the invitation was sent to.
3. Bookmark the page. On a phone you can add it to your home screen.

Larger changes (new pages, photos) are easier on a computer. Small text changes work fine on a phone.

## 2. Finding your way around

On the left is the **Content** menu:

| In the menu | What it is |
|---|---|
| **Festival → Home page** | The big banner (photo, big logo, dates, ticket button), the small logo in the top-left corner and everything below it on the festival's front page |
| **Festival → Pages** | Program, Teachers, Artists, Location, Code of Conduct, and any page you add |
| **Festival → Teachers** / **Artists** | One entry per person |
| **Community → Home page** | The front page of the community site: the headline, a short line and up to two buttons at the top, an optional banner photo behind them, the logo in the top bar, and the blocks below |
| **Community → Pages** | Pages of the community site |
| **Everyone (teachers and artists)** | All people in one list |
| **Site settings** | Community name, contact email, social links, "Hide the site from Google" |

Click an item to open it. Fields you can type in appear on the right.

## 3. Two languages, side by side

Most texts have two boxes next to each other: **English** and **Magyar**.

- Fill in both when you can.
- If you leave one empty, the site shows the other language there, so a page is never blank. You can translate later.
- Names, photos and links are entered once and used in both languages.

## 4. Saving and publishing

- **Everything you type is saved automatically** as a draft. Visitors do not see drafts.
- When you are happy, click **Publish** (green button, bottom right). The test website, **https://forro-bp-website.pdavid92.workers.dev**, shows it 2 to 5 minutes later. (The real forrobudapest.com stays as it is until the new site goes live.)
- To throw away changes you have not published yet, open the menu next to **Publish** and choose **Discard changes**.
- Made a mistake you already published? Click the clock icon (**History**) at the top of the document, pick an earlier version and restore it, then publish.

## 4a. Editing on the page (on a computer)

Instead of looking for the right form, you can edit the website where you see it.

1. At the top of the editor, click **Edit on the page**. The website appears, with your unpublished changes already in it.
2. Move the mouse over the page: texts and photos get a thin outline. **Click** one, and its field opens beside the page.
3. Type, or choose another photo. About a second after you stop typing, the page shows the change. Visitors do not see it yet.
4. Use the website's menu inside the view to go to another page, or the language switch for the Hungarian version.
5. When you are happy, click **Publish**, as in section 4.

The outlines only appear inside the editor; they are not on the real website. On a phone, use the lists in section 2 instead.

If a dark strip at the bottom says "unpublished changes are hidden", the page was opened outside the editor (or your browser blocked it): close it and click **Edit on the page** in the editor again. Unpublished changes are only ever shown to people signed in to the editor.

## 5. Common tasks

### Change the festival dates, ticket link or banner photo
1. Open **Festival → Home page**.
2. On the **Banner and tickets** tab, change **Dates** (both languages), **Ticket shop address** or **Banner photo**.
3. **Publish**.

The dates also appear in the header on wide screens.

### Change the festival introduction or the numbers line
1. Open **Festival → Home page** and go to the **Page content** tab.
2. Click a block (for example the introduction text) to open it, edit, and close it.
3. **Publish**.

### Add a teacher or an artist
1. Open **Festival → Teachers** (or **Artists**) and click the **+** (Create) button at the top of the list.
2. Fill in **Name**, choose the **Group**, add a **Photo**, the **Role** (teachers only, e.g. "Dance Teacher" / "Tánctanár"), the **Biography** in both languages and the **Instagram address** (copy it from the browser, starting with https://).
3. **Display order**: smaller numbers come first. Give the new person a number between the people they should sit between (e.g. 2.5 between 2 and 3).
4. **Publish**. The person appears on the Teachers or Artists page by themselves.

In the biography, an empty line starts a new paragraph.

### Remove a person
Open the person, click the **⋯** menu next to **Publish** and choose **Unpublish** (hides them; you can publish again later) or **Delete** (removes them for good).

### Photos: upload and choose what stays visible
1. Click **Upload** in a photo field, or drag a photo onto it. Photos straight from a phone are fine; the site makes smaller copies itself.
2. Some places show photos cut to a shape (people cards are square on computers, wider on phones). To choose what stays visible, click the **crop** (or pencil) button on the photo:
   - drag the **circle** onto the important part, such as a face. That part always stays in view;
   - drag the **corners** of the frame to cut away edges you never want to show.
3. Optional: under **Description for blind visitors**, write one short sentence about what the photo shows.

### Replace the program images
1. Open **Festival → Pages** → **Program**.
2. Each program graphic is an **Image** block. Click one and upload a new photo over it, or add a new **Image** block with **Add item** at the bottom.
3. Drag the blocks by their handle (⋮⋮) to change the order.
4. **Publish**.

### Edit a text page (Location, Code of Conduct)
1. Open **Festival → Pages** and choose the page.
2. Click the **Text** block. The toolbar gives you **bold**, *italic*, headings, lists and links.
3. To add a link: select words, click the link button, and type the address: `https://…` for another website, or for a page of this site just the part after the language, such as `/festival/program/`.
4. **Publish**.

### The event calendar
The calendar page shows one month's calendar picture at a time, with arrows to the other months. It opens on the current month, and a month disappears by itself once it is over, so there is nothing to clean up. Visitors can tap the picture to see it large.
1. Open the calendar page (e.g. **Community pages → Event calendar**) and click its **Event calendar** block. If the page has none yet, **Add item → Event calendar**.
2. Under **Months**, click **Add item**: choose the **Year** and **Month** and upload the **Calendar picture**.
3. **Publish**. A new month appears with an arrow from the month before it.

### Colours
Every colour choice (a page's colour, a block's background, the top bar, the language list) offers the colours listed in **Site settings → Colours**.
- **Change a colour everywhere:** click **Add the built-in colours to change their codes** once (if the button is there), then open a colour and type its new **Colour code** (e.g. `#c28f32`). Everything that uses it changes.
- **Add a colour:** **Add item**, give it a **Name** and a **Colour code**. It then appears in every colour choice. The text colour on it is picked automatically (dark grey or cream); set **Text colour on it** to choose yourself.
- **Top bar and language list:** under the list, choose a colour for each part of the site, or leave **Default**.
- If text would be hard to read on a colour, the maintainer sees a warning; nothing breaks. Deleting a colour that pages still use makes them fall back to the page or festival colour.

## 6. Building pages with blocks

Every page is a list of **blocks**, one under the other. You can add, remove and reorder them.

- **Add a block:** click **Add item** under the list and choose a kind.
- **Reorder:** drag a block by its handle (⋮⋮).
- **Remove:** open the block's **⋯** menu and choose **Remove**.

| Block | What it shows |
|---|---|
| **Text** | Paragraphs with headings, lists and links. **Style** tab → *Text style*: Normal, **Large** (big serif text, like the festival introduction) or **Statement** (one bold line, like "14 Workshops \| 4 Bands …") |
| **Heading** | A heading on its own, in three sizes |
| **Image** | One photo, wide, at text width, or across the whole screen, with an optional caption. Visitors can tap it to see it large (useful for the program pictures on phones) |
| **Gallery** | Several photos, as a **Grid** (three across, two on phones) or a **Mosaic** of big and small photos (best with 5 or 10). Visitors can click a photo to see it large and page through the rest |
| **Button** | A button to one of your pages (choose it from the list) or to an address |
| **People** | Teacher or artist cards. Leave the list empty to show everyone in the group automatically, or pick people to show only them |
| **Banner** | A photo with a title, short text and a button on top |
| **Columns** | 2 to 4 columns side by side (one under the other on phones), each with an optional photo, heading and text |
| **Video** | A YouTube or Vimeo video: paste the address from the browser |
| **Divider** | A thin line, or empty space |

Every block also has a **Style** tab:

- **Background**: *Same as page* or one of the colours from **Site settings → Colours** (Festival red, Mustard, Cream, Light cream, Dark and any you add). On community pages Festival red shows as Mustard and Cream as Light cream.
- **Alignment**: Left, Center or Right.

Blocks next to each other with the same background and alignment are joined into one band. For example, the numbers line and the Code of Conduct button on the festival home page are both "Center", so they sit together.

## 7. Making a new page

1. Open **Festival → Pages** (or **Community → Pages**) and click **+**.
2. **Page name** in both languages. It appears in the menu and the browser tab.
3. Optional: a **Big heading** shown at the top of the page, and a **Photo above the page**.
4. Add blocks under **Page content**.
5. On the **Settings** tab:
   - **Address**: click **Generate** to make it from the English name, e.g. `workshops` gives `/en/festival/workshops/`. Lowercase letters, numbers and hyphens only. Do not change it later: links people saved would stop working.
   - **Page colour**: one of the colours from **Site settings → Colours**: Festival red (like Program), Mustard (the Forró Budapest colour), Cream (like Location), Light cream, Dark, or one you added. On community pages Festival red shows as Mustard and Cream as Light cream.
   - **Show in the menu** and **Menu order** (smaller numbers first; Program is 1, Teachers 2, Artists 3, Location 11).
   - **Menu label**: a different, shorter name for the menu button, in both languages. Without it, the page name is used.
   - The festival button in the community menu is a community page too: in its **Settings**, **Menu button goes to** is set to **The festival home page**. Rename it with its title or **Menu label**, move it with **Menu order**, hide it with **Show in the menu**, like any page. It has no page of its own. (Without such a page, a festival button with the festival's name comes first.)
   - Optional: a shorter **Menu label**, and a **Short description** for Google and link previews.
6. **Publish**.

## 8. If something goes wrong

- Nothing you do in the editor can take the website down. If something cannot be shown (a link that is not a real address, a missing photo), the site leaves just that part out and tells the maintainer.
- If a change does not appear on the site within about ten minutes, or something looks wrong, tell the maintainer which page, which language, and what you changed. A screenshot helps.
- Please do not put private phone numbers or private emails on the site. Everything you publish is public.
