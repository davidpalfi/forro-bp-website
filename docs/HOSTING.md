# Putting it online (Cloudflare, free plan)

For Dávid. About 30 minutes. **Use a computer** (the dashboards are cramped on a phone). Nothing here touches forrobudapest.com, Wix or the `main` site, and nothing costs money.

Every step starts with a link. Open it in the same browser where you are signed in to Cloudflare (with GitHub) or Sanity. Written 2026-11-19 (step 1.2 corrected 2026-11-22 from Dávid's screenshot) from Cloudflare's and Sanity's documentation; the agent could not open the dashboards itself. If a button has a slightly different name, take the nearest match. If a link does not land where the step says, use the "or" route given with it. If something is missing entirely, stop and tell the agent what you see.

**Two secrets:** the Sanity token (part 2) and the deploy hook address (part 5). Paste them only into the boxes named in the steps: never into chat, e-mail or a file.

**Keep a note** for two addresses you will collect (not secret): the *preview address* and the *test address*.

---

## Part 1. The preview site (10 minutes)

**1.1** Open https://dash.cloudflare.com/?to=/:account/workers-and-pages/create
(or: https://dash.cloudflare.com/?to=/:account/workers-and-pages and click the blue **Create** button, top right).
If it asks which account, click yours.

**1.2** The page "Create an app / Make something new" shows tiles. Click **Connect GitHub** (top left tile). Not "Hello World", not "Upload your static files", not "Continue to Pages".

**1.3** Only the first time, GitHub opens:
- choose **Only select repositories**,
- in the drop-down pick **forro-bp-website**,
- click **Install & Authorize** (GitHub may ask for your password).
You land back in Cloudflare.

**1.4** A list of your repositories. Click **forro-bp-website**, then **Begin setup** (or **Next**).

**1.5** A form. Fill in exactly (copy and paste):

| Field | Value |
|---|---|
| Project name | `forro-budapest-preview` |
| Build command | `npm run preview:build` |
| Deploy command | `npx wrangler deploy` |

Leave all other fields alone. If you see a **Branch** / **Production branch** field, choose `feature/sanity`.

**1.6** Click **Create and deploy** (or **Save and Deploy**).

**1.7** If it asks you to choose a **workers.dev subdomain**: type something short, e.g. `davidpalfi`, and confirm. This word appears in both addresses.

**1.8** You now see the build running. **It will probably fail** with a red cross, because Cloudflare builds the `main` branch first. That is expected. Go on.

**1.9** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-preview/production/settings
(or: https://dash.cloudflare.com/?to=/:account/workers-and-pages > click **forro-budapest-preview** > the **Settings** tab).

**1.10** Scroll to the **Build** section. Find **Branch control** and click the pencil icon next to it.
- **Production branch**: choose `feature/sanity`
- **Builds for non-production branches**: remove the tick
- Click **Save**.

**1.11** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-preview/production/deployments
(or: the **Deployments** tab at the top of the same page).
Next to the failed build click **⋯** > **Retry build** (or a **Retry build** button). If there is none, tell the agent: it will start a build for you by pushing a small change.

**1.12** Wait 2-4 minutes until the build has a green tick.

**1.13** At the top of the page (or on the **Settings** tab, section **Domains & Routes**) there is an address ending in `.workers.dev`, e.g. `https://forro-budapest-preview.davidpalfi.workers.dev`. Copy it into your note as **preview address**.

**1.14** Open the preview address. You see the festival page with a **dark strip at the bottom**: "Preview: unpublished changes are hidden ...". Good: that is the lock.

---

## Part 2. The preview's Sanity token (5 minutes)

**2.1** Open https://www.sanity.io/manage/project/8hc671sk/api
(or: https://www.sanity.io/manage > click **Forró Budapest** > the **API** tab at the top).

**2.2** Find the **Tokens** section (a heading on that page, or **Tokens** in the left list). Click **Add API token**.

**2.3** Fill in:
- **Name**: `Cloudflare preview`
- **Permissions**: **Viewer**
- Click **Save**.

**2.4** A long code appears, **only this once**. Click **Copy**. Keep this tab open.

**2.5** In a new tab open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-preview/production/settings
(or: Workers & Pages > **forro-budapest-preview** > **Settings**).

**2.6** Find the section **Variables and Secrets** (near the top; *not* the one inside the Build section). Click **+ Add**.

**2.7** Fill in:
- **Type**: **Secret** (not Text)
- **Variable name**: `SANITY_VIEWER_TOKEN`
- **Value**: paste (Ctrl+V / Cmd+V)
- Click **Deploy** (or **Save and deploy**).

**2.8** Close the Sanity tab. The token is now stored only in Cloudflare, which is how it should be.

**2.9** Open the preview address again: still the page with the dark strip. That is right; drafts show only when the Studio opens it (part 6).

---

## Part 3. The test site (10 minutes)

**3.1** Open https://dash.cloudflare.com/?to=/:account/workers-and-pages/create again. Click **Connect GitHub** (or, once connected, the GitHub tile / your GitHub account) > **forro-bp-website** > **Begin setup**.

**3.2** Fill in exactly:

| Field | Value |
|---|---|
| Project name | `forro-budapest-test` |
| Build command | `CONTENT_SOURCE=sanity npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.site.jsonc` |

**3.3** **Create and deploy**. The build may fail again (wrong branch). Go on.

**3.4** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-test/production/settings
(or: Workers & Pages > **forro-budapest-test** > **Settings**).

**3.5** **Build** section > **Branch control** > pencil: production branch `feature/sanity`, remove the tick at non-production builds, **Save** (as in 1.10).

**3.6** Find this Worker's address (as in 1.13), e.g. `https://forro-budapest-test.davidpalfi.workers.dev`. Copy it into your note as **test address**.

**3.7** Still in the **Build** section, find **Variables and secrets** *inside Build* (build variables). Click **+ Add**:
- **Type**: Text
- **Variable name**: `SITE_URL`
- **Value**: the test address, beginning with `https://` and ending with `.workers.dev`
- **Save**.

**3.8** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-test/production/deployments > **⋯** > **Retry build**. Wait for the green tick.

**3.9** Open the test address: the site with the content from Sanity, **no** dark strip.

---

## Part 4. Check (2 minutes)

Replace *preview* and *test* with your two addresses:

| Open | You should see |
|---|---|
| *preview address* | festival page, dark strip |
| *preview address*`/hu/festival/` | Hungarian festival page, dark strip |
| *test address* | festival page, no strip |
| *test address*`/en/festival/teachers/` | the teachers |
| *test address*`/en/nothing-here/` | the site's "page not found" |

---

## Part 5. Rebuild when someone clicks Publish (5 minutes)

**5.1** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-test/production/settings > **Build** section > **Deploy Hooks** > **+ Add** (or **Create deploy hook**).
- **Name**: `Sanity publish`
- **Branch**: `feature/sanity`
- **Save**.

**5.2** An address appears, starting with `https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/`. Click **Copy**. (Secret.)

**5.3** Open https://www.sanity.io/manage/project/8hc671sk/api (as in 2.1). Find **Webhooks** (a heading or left-list item) > **Create webhook** (or **Add webhook**).

**5.4** Fill in:

| Field | Value |
|---|---|
| Name | `Rebuild test site` |
| Description | leave empty |
| URL | paste the deploy hook address |
| Dataset | `production` |
| Trigger on | tick **Create**, **Update**, **Delete** |
| Filter | `_type in ["siteSettings", "communitySettings", "festivalSettings", "page", "person"]` |
| Projection | leave empty |
| Status | Enabled |
| Drafts | **no** tick |
| Versions | **no** tick |
| HTTP method | `POST` |
| HTTP headers, API version, Secret | leave as they are |

Click **Save**. If Sanity says webhooks are not available on your plan, stop and tell the agent (fallback: a rebuild every hour).

**5.5** Test it. Open https://forro-budapest.sanity.studio > **Festival home page** > add a full stop somewhere, e.g. at the end of the Hungarian date line > **Publish**.

**5.6** Open https://dash.cloudflare.com/?to=/:account/workers/services/view/forro-budapest-test/production/deployments. Within a minute a new build appears. Wait for the green tick, then reload the test address: the full stop is there. Remove it in the Studio and publish again.

---

## Part 6. Send the agent the two addresses, then deploy the Studio

**6.1** Send the agent the **preview address** and the **test address**.

**6.2** The agent saves them in the project and tells you when it is pushed.

**6.3** On your computer, open Terminal and run, one line at a time:

```
cd ~/src/forro-budapest-site
git pull
npm ci
npm run studio:deploy
```

It prints `"Edit on the page" will open https://forro-budapest-preview...` and deploys the Studio.

**6.4** Open https://forro-budapest.sanity.studio > **Edit on the page** (top). The page appears **without** the dark strip. Click a text and type a word: about a second later the page shows it, without flashing or jumping to the top. Nothing is published unless you click Publish.

**6.5** Do 6.4 in **Safari** too and tell the agent whether the dark strip is gone there (Safari is the browser most likely to block the preview's cookie).

---

## If something goes wrong

- **A build fails** (red cross): open the Worker's deployments link (1.11 or 3.8) > click the failed build > **View build log**. Scroll to the end, copy the last 30 lines, send them to the agent (no secrets in them). A failed build changes nothing online.
- **"Name mismatch" / "does not match the name in your wrangler config"**: the Project name is not exactly `forro-budapest-preview` / `forro-budapest-test`. Tell the agent what you typed.
- **The build log says it built `main`**: branch control was not saved; repeat 1.10 / 3.5 and retry.
- **The preview says "could not load the content from Sanity"**: the token is wrong or saved as Text. Repeat part 2 with a new token.
- **Inside the Studio the dark strip stays**: click **Open preview** (arrow icon above the page) once, then go back. Tell the agent which browser.
- **Undo a bad deployment**: the deployments link > an earlier working one > **⋯** > **Rollback**.
- **Remove everything**: the Worker's settings link > bottom of the page > **Delete**. Nothing else is affected.
- **Costs**: free plan: 100,000 visits a day and 3,000 build minutes a month for the account (a build takes 2-4 minutes). Nothing is charged unless you add a payment method and upgrade.
