# Sanity Port: Go-Live Checklist

This checklist is for replacing the Pages CMS proof of concept only after the Sanity port is built and accepted. The existing site stays live during development. Do not cancel Wix or redirect the domain until the replacement is verified.

## 1. Confirm the plan

**Confirmed by Dávid (2026-11-16):** bilingual fields, a full page builder, hosted Studio, and Sanity image delivery (S1-S4). Stage 1 schemas are implemented on `feature/sanity`; they do not yet power the site.

**Next owner action:** verify current Sanity Free-plan limits and terms directly: seats, roles, dataset visibility, Studio hosting, image usage, and any limits relevant to the site. Verify Cloudflare Free-plan capabilities before choosing preview/production hosting. Record the date and findings in `DECISIONS.md`; the Growth trial is temporary and must not justify paid-only features.

## 2. Create and secure accounts

**Done:** the Studio is configured for Sanity project `8hc671sk`, dataset `production`. These identifiers are not secrets.

**Still required:** confirm dataset visibility and access roles. Never put private care-team contact details in public content. Provide write credentials only through a local secret manager or provider secret settings, never in chat or source control.

**Dávid:** create or select the Cloudflare account and connect the repository after the preview build is ready. Ensure the account and repository ownership are understood and recovery access is available.

**Dávid:** keep API tokens, webhook secrets, and provider credentials out of chat and source files. Enter them directly into the secret settings required by the implemented deployment. The exact secret names must be documented by the code when it exists; do not guess names now.

## 3. Finish the port on `feature/sanity`

**Maintainer/agent:** verify Free-plan fit, deploy the Studio with `npm run studio:deploy`, and test the hosted URL and maintainer access. Then audit the Stage 1 schemas against every current JSON field and document schema corrections. Implement the idempotent migration, Sanity data access, image handling, SSR preview, static production build, and publish-triggered rebuild in that order. Preserve existing routes and behavior unless Dávid approves a change. The detailed sequence and current gaps are in `SANITY-PORT-STATUS.md`.

**Maintainer/agent:** document actual environment variables, secret names, local commands, deployment provider settings, and rollback steps in `README.md`/`ARCHITECTURE.md` once they are known. Do not add credentials to example files.

**Maintainer/agent:** add automated checks for the migrated content and build. Run `npm ci`, `npm run check`, and `npm run build`. Exercise the preview and public output; verify bilingual pages, links, images, metadata, base paths, and noindex behavior.

## 4. Migrate and test before production

**Dávid + maintainer:** back up the source JSON and decide how repeated migration runs behave before importing. Run the migration into the intended test or production dataset only after reviewing its write/replace behavior.

**Maintainer:** compare imported document counts and representative fields against `src/content`, including both languages, people groups, page slugs, ordering, and program-image order. Verify image assets and crop behavior. Resolve mismatches before inviting the admin.

**Dávid:** invite the admin and have her do the acceptance test herself. On desktop, open the visual preview and edit a page; on her phone, use Sanity's normal editor. Have her update a bilingual text, a person, a program image, and a home/text-page block if blocks are approved. Preview, publish, and confirm the live result in both languages.

Keep the current PoC as the fallback during the trial. Do not treat successful local builds as acceptance of the editing workflow.

## 5. Prepare production

**Dávid:** decide the production host, public/private repository policy, domain owner/access, who receives build alerts, and the launch date. Cloudflare production hosting is not yet a settled decision.

**Maintainer:** configure production environment values and secrets through the provider's secret manager; set up and test the Sanity publish webhook; verify a publish triggers one successful rebuild and a failed build does not replace the last known-good site.

**Dávid + maintainer:** replace placeholder photos, bios, location copy, and Hungarian gaps through Sanity. Keep private contact details out of the public repository and dataset. Have a Hungarian speaker check fixed wording.

**Maintainer:** configure the chosen custom domain and HTTPS. Keep `noindex` enabled until the owner approves public indexing, then verify the production robots metadata before launch.

## 6. Switch traffic only after sign-off

- Review the design with the admin on phone and desktop and record her approval.
- Verify the public build, Sanity editor, preview, publish webhook, alerts, and rollback path.
- Add redirects for old Wix addresses on a host that supports them. Confirm the exact Hungarian Wix paths before configuring them.
- Point the domain to the new host, verify HTTPS and redirects, and keep Wix active until the new site and domain are confirmed working.
- Turn off `noindex` only when the owner explicitly approves launch.
- After launch, make one test content edit and confirm it publishes. Monitor the first builds and retain the prior PoC/rollback path until stable.

### Known old addresses to check

| Old Wix address | Candidate destination |
|---|---|
| `/` | Decide whether this becomes the community home or `/en/festival/` |
| `/program` | `/en/festival/program/` |
| `/teachers` | `/en/festival/teachers/` |
| `/music` | `/en/festival/artists/` |
| `/location` | `/en/festival/location/` |
| `/code-of-conduct` | `/en/festival/code-of-conduct/` |
| `/hu`, `/hu/...` | Check the actual Wix Hungarian addresses, then map them to `/hu/festival/...` |

The table is a starting point, not a final redirect specification. Verify every destination and preserve query strings where the selected host supports it.