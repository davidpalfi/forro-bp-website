# Putting it online (Cloudflare, free plan)

For Dávid. About 30 minutes. **Use a computer**: the Cloudflare and Sanity dashboards are cramped on a phone. Nothing here touches forrobudapest.com, Wix or the `main` site, and nothing costs money.

Written on 2026-11-19 from Cloudflare's and Sanity's documentation; the agent could not open the dashboards themselves. If a button has a slightly different name, look for the nearest match; if something is missing entirely, stop and tell the agent what you see.

## What you are making

Two "Workers" (Cloudflare's word for a site it hosts). Both are built from the GitHub repository `forro-bp-website`, branch `feature/sanity`:

| Name | What it is | Its address |
|---|---|---|
| `forro-budapest-preview` | The click-to-edit preview the Studio shows in **Edit on the page**. Drafts appear only when it is opened from the signed-in Studio | `https://forro-budapest-preview.<your-subdomain>.workers.dev` |
| `forro-budapest-test` | The test version of the public site. Rebuilt when someone clicks **Publish** | `https://forro-budapest-test.<your-subdomain>.workers.dev` |

`<your-subdomain>` is your account's own word, the same for both (for example `david-abc`).

**Keep two things secret:** the Sanity token (part 2) and the deploy hook address (part 5). Paste them only into the boxes the steps name: never into chat, e-mail or a file. The two `workers.dev` addresses are not secret.

Keep a note open (on paper or your phone) for: the preview address, the test address.

---

## Part 1. The preview Worker (about 10 minutes)

### 1a. Create it

1. Open **https://dash.cloudflare.com** and sign in (you signed in with GitHub before).
2. If Cloudflare asks which account, choose yours.
3. In the left menu, click **Compute (Workers)** > **Workers & Pages**. (On some screens it is just **Workers & Pages**.)
4. Click the blue **Create** button (top right; it may say **Create application**).
5. You see tabs or tiles. Choose **Import a repository** and click **Get started** next to it.
   - If this is the first time: Cloudflare asks to connect GitHub. Click **Connect GitHub**, then on GitHub's page choose **Only select repositories** > `forro-bp-website` > **Install & Authorize**. You come back to Cloudflare.
6. In the list of repositories, click `forro-bp-website` > **Begin setup** (or **Next**).
7. Fill in the form:

   | Field | Type exactly |
   |---|---|
   | **Project name** | `forro-budapest-preview` |
   | **Build command** | `npm run preview:build` |
   | **Deploy command** | `npx wrangler deploy` |

   Leave everything else as it is (path `/`, no variables yet). If the form shows a **Branch** or **Production branch** field, choose `feature/sanity`; if it does not, part 1b fixes it.
8. Click **Create and deploy** (or **Save and Deploy**).
9. If Cloudflare asks you to choose a **workers.dev subdomain**, pick something short, e.g. your name. This becomes `<your-subdomain>` for both Workers.

### 1b. Make it build the right branch

The first build may use the repository's main branch (`main`), which has no preview yet, so it **fails**. That is expected and harmless.

1. Open the Worker: **Workers & Pages** > `forro-budapest-preview`.
2. Click the **Settings** tab, then **Build** in the list on the left (or scroll to the **Build** section).
3. Find **Branch control**. Click the pencil/edit icon.
   - **Production branch**: choose `feature/sanity`.
   - **Builds for non-production branches**: **untick** it (otherwise every work-in-progress branch would start a build).
   - **Save**.
4. Go to the **Deployments** tab. Click **Retry build** on the failed one, or the **⋯** menu > **Retry build**. If there is no such button, tell the agent: it will push a small change, which starts a build.
5. Wait 2-4 minutes. The build shows a green tick (**Success**).

### 1c. Write down its address

On the Worker's main page (**Overview**, or top right of **Deployments**) you see **Domains & Routes** or a link ending in `workers.dev`. Write it down as **preview address**, e.g. `https://forro-budapest-preview.david-abc.workers.dev`.

Open it in a new tab. You should see the festival home page **with a dark strip at the bottom**: "Preview: unpublished changes are hidden ...". That strip is the lock working. If you see an error page instead, wait for part 2, then check again.

---

## Part 2. Give the preview its Sanity token (about 5 minutes)

The preview needs a "Viewer" token to read drafts. Make a **new** one just for Cloudflare (do not reuse the one in your `.env`), so either can be revoked on its own.

### 2a. Make the token in Sanity

1. Open **https://www.sanity.io/manage** and sign in.
2. Click the project **Forró Budapest**.
3. Click the **API** tab at the top.
4. In the left list, click **Tokens**.
5. Click **Add API token**.
   - **Name**: `Cloudflare preview`
   - **Permissions**: **Viewer**
   - Click **Save**.
6. A long code appears **once**. Click **Copy** next to it. Do not close this window until 2b is done.

### 2b. Put it in Cloudflare as a secret

1. Back in Cloudflare: **Workers & Pages** > `forro-budapest-preview` > **Settings**.
2. Find **Variables and Secrets** (this is the Worker's own settings, *not* the ones under Build). Click **Add** (or **+ Add**).
3. Fill in:
   - **Type**: **Secret** (important: not "Text")
   - **Variable name**: `SANITY_VIEWER_TOKEN`
   - **Value**: paste the token
4. Click **Deploy** (or **Save and deploy**). It takes effect within a minute; no new build is needed.
5. Now you can close the Sanity window. The token is no longer visible anywhere, which is how it should be.

Check: the preview address should still show the page with the dark strip. That is right: drafts only appear when the Studio opens the page (part 6).

---

## Part 3. The test site Worker (about 10 minutes)

### 3a. Create it

Same as part 1a, with different values:

1. **Workers & Pages** > **Create** > **Import a repository** > **Get started** > `forro-bp-website` > **Begin setup**.
2. Fill in:

   | Field | Type exactly |
   |---|---|
   | **Project name** | `forro-budapest-test` |
   | **Build command** | `CONTENT_SOURCE=sanity npm run build` |
   | **Deploy command** | `npx wrangler deploy --config wrangler.site.jsonc` |

3. **Create and deploy**. The first build may fail again (wrong branch). Fine.

### 3b. Right branch, and its own address

1. `forro-budapest-test` > **Settings** > **Build** > **Branch control**: production branch `feature/sanity`, **untick** non-production builds, **Save**.
2. Write down its address (part 1c) as **test address**, e.g. `https://forro-budapest-test.david-abc.workers.dev`.
3. Still in **Settings** > **Build**, find **Variables and secrets** *under Build* (these are used while building; not the ones from part 2b). Click **Add**:
   - **Type**: Text
   - **Variable name**: `SITE_URL`
   - **Value**: the test address, starting with `https://`, without anything after `.dev`
   - **Save**.
4. **Deployments** > **Retry build** (part 1b, step 4). Wait 2-4 minutes for the green tick.
5. Open the test address. You see the site with the content from Sanity, and **no** dark strip (this is the public version).

---

## Part 4. Check both

| Open | You should see |
|---|---|
| preview address | the festival page, dark strip at the bottom |
| preview address + `/hu/festival/` | the Hungarian festival page, dark strip |
| test address | the festival page, no strip |
| test address + `/en/festival/teachers/` | the teachers |
| test address + `/en/nothing-here/` | the site's "page not found" |

If one fails, see "If something goes wrong" at the end.

---

## Part 5. Rebuild the test site when someone clicks Publish (about 5 minutes)

### 5a. A deploy hook in Cloudflare

1. `forro-budapest-test` > **Settings** > **Build** > **Deploy Hooks** > **Add deploy hook** (or **Create**).
   - **Name**: `Sanity publish`
   - **Branch**: `feature/sanity`
   - **Save**.
2. An address appears, starting with `https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/...`. **Copy** it. It is secret: anyone with it can start builds.

### 5b. A webhook in Sanity

1. **https://www.sanity.io/manage** > **Forró Budapest** > **API** > **Webhooks** (left list) > **Create webhook** (or **Add webhook**).
2. Fill in:

   | Field | Value |
   |---|---|
   | **Name** | `Rebuild test site` |
   | **Description** | (empty) |
   | **URL** | paste the deploy hook address |
   | **Dataset** | `production` |
   | **Trigger on** | tick **Create**, **Update** and **Delete** |
   | **Filter** | `_type in ["siteSettings", "communitySettings", "festivalSettings", "page", "person"]` |
   | **Projection** | (empty) |
   | **Status** | Enabled |
   | **Drafts** | off (unticked): only published changes rebuild |
   | **Versions** | off (unticked) |
   | **HTTP method** | `POST` |
   | **HTTP headers**, **API version**, **Secret** | leave as they are / empty |

3. **Save**.

If Sanity says webhooks are not available on your plan, stop here and tell the agent; the fallback is a rebuild every hour.

### 5c. Try it

1. Open the Studio: **https://forro-budapest.sanity.studio**.
2. **Festival home page** > change one small thing (e.g. add a full stop to the Hungarian date line) > **Publish**.
3. In Cloudflare: `forro-budapest-test` > **Deployments**. Within a minute a new build appears ("deploy hook"). Wait for the green tick.
4. Reload the test address: the change is there. Undo the change in the Studio and publish again if you like.

---

## Part 6. Send the agent the two addresses; then deploy the Studio

1. Send the agent the **preview address** and the **test address** (both not secret).
2. The agent puts the preview address into `studio/.env.production` and the test address into the admin guide, and pushes it.
3. Then, on your computer, in the project folder (`cd ~/src/forro-budapest-site`):

   ```
   git pull
   npm ci
   npm run studio:deploy
   ```

   It prints `"Edit on the page" will open https://forro-budapest-preview...` and deploys. (`studio:deploy` refuses to run until the preview address is set, so the admin can never get a tab pointing at your computer.)
4. Open **https://forro-budapest.sanity.studio** > **Edit on the page**. The page appears **without** the dark strip. Click a text, type a word: about a second later the page shows it, without flashing or jumping to the top. Do not publish if you do not want to.
5. Please try this in **Safari** too: it is the browser most likely to block the preview's cookie. Tell the agent whether the strip disappears there.

---

## If something goes wrong

- **A build fails** (red cross): the Worker > **Deployments** > click the failed build > **View build log** (or **Logs**). Scroll to the end. Send the agent the last 30 lines (they contain no secrets). Nothing is deployed when a build fails, so the previous version stays online.
- **"Name mismatch" / "the name in your wrangler config does not match"**: the Worker's name in Cloudflare is not exactly `forro-budapest-preview` / `forro-budapest-test`. Tell the agent which name you used.
- **The build used `main`**: branch control (part 1b / 3b) was not saved. Set it again and retry.
- **The preview shows "could not load the content from Sanity"**: the token is wrong or not a Secret (part 2). Make a new Viewer token and replace the secret.
- **Inside the Studio the dark strip stays**: the browser blocked the preview's cookie, or the Studio was deployed before part 6. Click **Open preview** (arrow icon above the page) once, then go back; tell the agent which browser.
- **Undo a bad deployment**: the Worker > **Deployments** > an earlier, working one > **⋯** > **Rollback**.
- **Stop it all**: the Worker > **Settings** > **Delete**. The site disappears; nothing else is affected.
- **Costs**: the free plan allows 100,000 visits a day and 3,000 build minutes a month for the whole account (each build takes 2-4 minutes). Cloudflare charges nothing unless you add a payment method and upgrade.
