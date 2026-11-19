# Putting it online (Cloudflare, free plan)

For Dávid. About 20 minutes on a computer (the Cloudflare and Sanity dashboards are cramped on a phone). Nothing here touches forrobudapest.com, Wix or the `main` site.

Two "Workers" (Cloudflare's name for a site it hosts), both built from this GitHub repository, branch `feature/sanity`:

| Worker | What it is | Address |
|---|---|---|
| `forro-budapest-preview` | The click-to-edit preview the Studio shows in **Edit on the page**. Shows drafts only when opened from the signed-in Studio | `https://forro-budapest-preview.<your-subdomain>.workers.dev` |
| `forro-budapest-test` | The test version of the public site. Rebuilt when someone clicks **Publish** in the Studio | `https://forro-budapest-test.<your-subdomain>.workers.dev` |

`<your-subdomain>` is chosen by Cloudflare for your account; you see it after step 1. The two addresses are not secret: send them to the agent when you have them. **Tokens and the deploy hook address are secret**: paste them only where the steps say, never in chat or a file.

## Before you start

The code must be on `feature/sanity` (the agent's pull request merged). Cloudflare builds that branch.

## 1. The preview

1. Open **dash.cloudflare.com** > **Workers & Pages** > **Create** > **Import a repository**. If asked, connect GitHub and allow access to `forro-bp-website`.
2. Choose `forro-bp-website`. Fill in:
   - **Project name**: `forro-budapest-preview` (exactly; it must match `wrangler.jsonc`)
   - **Build command**: `npm run preview:build`
   - **Deploy command**: `npx wrangler deploy`
   - Under **Advanced settings**, **Branch** (production branch): `feature/sanity`
3. **Create and deploy.** Wait for the build to finish (2-4 minutes). The address appears at the top: write it down.
4. Make a token for it: **sanity.io/manage** > Forró Budapest > **API** > **Tokens** > **Add API token**. Name: `Cloudflare preview`, permissions: **Viewer**. Copy it (it is shown once).
5. Back in Cloudflare, the Worker `forro-budapest-preview` > **Settings** > **Variables and Secrets** > **Add**. Type: **Secret**, name: `SANITY_VIEWER_TOKEN`, value: paste the token. **Deploy**.
6. Open the preview's address in a browser. You should see the festival home page with a dark strip at the bottom: "Preview: unpublished changes are hidden...". That is the lock working.

## 2. The test site

1. **Workers & Pages** > **Create** > **Import a repository** > `forro-bp-website` again. Fill in:
   - **Project name**: `forro-budapest-test`
   - **Build command**: `CONTENT_SOURCE=sanity npm run build`
   - **Deploy command**: `npx wrangler deploy --config wrangler.site.jsonc`
   - **Branch**: `feature/sanity`
2. **Create and deploy**, wait, write down the address.
3. The Worker > **Settings** > **Build** > **Variables and secrets** (the *build* ones, not the ones from step 1.5) > **Add**: name `SITE_URL`, value: the test site's address, e.g. `https://forro-budapest-test.abc123.workers.dev`. Save, then **Deployments** > **Retry build** (or push any change).
4. Open the address: the site, from the content in Sanity.

## 3. Rebuild on Publish

1. The Worker `forro-budapest-test` > **Settings** > **Build** > **Deploy Hooks** > **Add deploy hook**. Name: `Sanity publish`, branch: `feature/sanity`. Copy the address it shows (secret: anyone with it can start builds).
2. **sanity.io/manage** > Forró Budapest > **API** > **Webhooks** > **Create webhook**:
   - **Name**: `Rebuild test site`
   - **URL**: paste the deploy hook address
   - **Dataset**: `production`
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type in ["siteSettings", "communitySettings", "festivalSettings", "page", "person"]`
   - **Drafts**: off (only published changes rebuild), **Versions**: off
   - **HTTP method**: POST. Leave the rest as it is. **Save**.
3. Test: in the Studio change one word, **Publish**. In Cloudflare, `forro-budapest-test` > **Deployments** shows a new build within a minute; 2-4 minutes later the test site shows the change.

If Sanity says webhooks are not available on the free plan, tell the agent: the fallback is a scheduled rebuild.

## 4. Point the Studio at the preview (the agent does this)

Send the agent the preview's address. The agent puts it in `studio/.env.production` and asks you to run, on your computer, in the project folder:

```
git pull
npm run studio:deploy
```

`studio:deploy` refuses to run until that address is set, so the admin can never get an "Edit on the page" that points at your computer.

## If something goes wrong

- **A build fails**: the Worker > **Deployments** > the failed build > **View logs**. Nothing is deployed, so the previous version stays online. Send the agent the last 30 lines of the log (they contain no secrets).
- **"Name mismatch" when building**: the project name in Cloudflare differs from `name` in `wrangler.jsonc` / `wrangler.site.jsonc`. Rename the Worker, or ask the agent to change the file.
- **The preview always shows the dark strip, also inside the Studio**: the token is missing or wrong (step 1.5), or the browser blocks the preview's cookie. Try **Open preview** (the arrow icon above the page in the Studio) once; tell the agent which browser.
- **Undo a bad deployment**: the Worker > **Deployments** > an earlier version > **Rollback**.
- **Costs**: both run on the free plan (100,000 visits a day and 3,000 build minutes a month for the account). Nothing is charged unless you add a payment method and upgrade.
