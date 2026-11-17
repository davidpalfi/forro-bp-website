# Sanity Port Status

Status as of 2026-11-17. This is the current progress record for the `feature/sanity` branch. Update it as work is completed; do not treat plans as implementation.

## Current checkpoint

- Branch: `feature/sanity`, created for the port from `main`.
- Stage 1 implementation commit: `2e6a644` (`feat: add Sanity Studio schemas`), pushed to `origin/feature/sanity`.
- The branch has exact-pinned Sanity, Portable Text, Astro Cloudflare/React, and related dependencies in `package.json` and `package-lock.json`; the planning brief is at repository root as [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md).
- A credential-pattern scan found no secrets. The non-secret project ID and dataset name are configured in the Studio; no API token, Cloudflare account setting, or production secret has been added to the repository.
- Stage 1 adds a Sanity-hosted Studio configuration in `studio/` for project `8hc671sk`, dataset `production`, and schemas for singleton settings, pages, reusable people, Portable Text, hotspot images, and all S2 page blocks. It uses standard Studio capabilities; no paid-plan feature is configured.
- `npm run build` and `npm run check` pass after the dependency changes. `npm run studio:build` and Sanity schema validation pass; validation reports zero errors and warnings.
- The Studio has not been deployed to Sanity hosting, and invited-editor access has not been tested. No migration script, Sanity content query, Astro integration, SSR preview, page rendering change, webhook, or deployment workflow has been implemented. Site pages remain untouched.
- Dávid confirmed the plan and the four choices on 2026-11-16 (see "Confirmed choices"). The Sanity project ID and dataset are now available and configured.
- Stage 1 is implemented and validated on `feature/sanity`; it does not change site behavior. The schemas define the target content shape but do not migrate existing JSON data.

## Implemented schema inventory

- Studio config: `studio/sanity.config.ts` and `studio/sanity.cli.ts`; fixed project ID `8hc671sk`, dataset `production`. These identifiers are configuration, not credentials.
- Singleton documents: `siteSettings`, `communitySettings`, and `festivalSettings`; English/Hungarian text fields are paired in the same document.
- `person`: bilingual name, role and bio, group (`Teacher` or `Artist`), image, Instagram URL, and order. People-grid blocks reference reusable people documents.
- `page`: bilingual title, URL slug, section, descriptions/menu labels, visibility/order, and a reorderable `blocks` array.
- Blocks: heading, rich text, image, gallery, button, banner, columns, video, divider, and people grid. Style choices include default/red/cream/dark backgrounds and left/center/right alignment where applicable.
- Shared types: Portable Text (`richText`) and hotspot-enabled `imageWithAlt` with English/Hungarian alt text.
- Home and program content is attached through references from community/festival settings to page documents. Images can be represented in page blocks. There is not yet a runtime fallback or an import mapping that proves all current JSON fields are preserved.

## Next steps, in order

1. **Verify Free-plan fit and deploy the Studio.** Check current Studio hosting, seat/role, dataset visibility, and image limits; sign in with the maintainer account, run `npm run studio:deploy`, and test the hosted URL. Do not use Growth-only features. Invited-editor access remains untested.
2. **Audit model coverage.** Map every current JSON field under `src/content/` to a Sanity field. Resolve missing or ambiguous fields before migration, especially community/festival intro and stats, program-image arrays/order, phone-specific hero image, page flags, and routing conventions. Update `DECISIONS.md` and `SPEC.md` for any model change.
3. **Implement migration safely.** Specify stable IDs, idempotent writes, dry-run output, image uploads/references, and failure recovery. Default to no deletions. Verify a repeated run produces no unintended changes. Do not write to the production dataset until the mapping and behavior are reviewed.
4. **Add Sanity reads and preserve site behavior.** Implement queries/helpers and parity tests, then adapt existing Astro templates. Keep bilingual fallback, URL safety, metadata, ordering, static public output, and all current routes.
5. **Implement preview.** Verify current Cloudflare Free-plan limits and official Sanity Astro guidance. Add SSR/Visual Editing for preview only, protect draft access and credentials, and confirm public builds cannot include drafts.
6. **Implement publish rebuild.** Choose production host/provider and webhook mechanism; record required secret names/configuration in docs without recording secret values. Test rebuild success, failure, and rollback.
7. **Validate and get owner acceptance.** Test clean install/build/check, Studio schemas, migration parity, phone/desktop output, invited-editor sign-in, preview, publish, and rollback. Keep the current PoC live until Dávid and the admin sign off.

Do not treat schema validation as proof that imports, runtime reads, fallback behavior, Studio hosting, or Free-plan eligibility have been tested.

## Existing product baseline

- The current PoC is reported live at <https://davidpalfi.github.io/forro-bp-website/>. It is the Pages CMS/GitHub Pages version on `main`; preserve it while the Sanity branch is developed and tested.
- Pages CMS was connected on 2026-11-15. Dávid found its detached forms unintuitive for the admin.
- The original site has bilingual community and festival routes, people, text pages, program images, responsive design, and the original JSON content. See the historical baseline in `HANDOFF.md` and `SPEC.md`.
- The `/docs` files previously described the Pages CMS proposal as if it were the current plan. They have now been annotated to distinguish that baseline from this port.

## Scope from the brief

1. Model site, community, festival, people, text pages, and program-image content in Sanity.
2. Import current `src/content` JSON into Sanity with a migration script.
3. Read the site content from Sanity while preserving the existing templates and design.
4. Keep public output static and provide an SSR visual-editing preview on Cloudflare.
5. Rebuild the public site when content is published in Sanity.
6. Update the decisions, architecture, handoff, specification, and Sanity editing documentation.

Stage 1 covers the schema portion of item 1. Items 2-5 remain pending. The docs record implementation status and planned acceptance criteria; only the checks named above have passed.

## Confirmed choices (Dávid, 2026-11-16)

Settled; do not ask again. Details and reasons are in `DECISIONS.md`, "Sanity port decisions" (S1 to S4).

- **S1 Languages:** English and Hungarian side by side in each document, with the current fallback.
- **S2 Page content:** a full page builder. The admin can create pages; every page is a list of blocks (heading, text, image, gallery, button, banner, columns, video, divider, people grid) with a few style options; teachers and artists are reusable entries placed with the people grid block. This is wider than the brief's proposal.
- **S3 Editor:** Sanity Studio hosted by Sanity, not embedded in the site.
- **S4 Photos:** Sanity's image service, with cropping in the editor.

Dávid approved staged implementation. The project ID and dataset are now configured; credentials and account access are still not in the repository.

## Still open or to verify

- Use Cloudflare for the SSR preview; decide whether it also hosts production.
- Choose the production rebuild provider and the exact webhook mechanism.
- Verify current Sanity free-plan limits, dataset visibility, roles/seats, visual-editing availability, and invited-editor sign-in before relying on them.
- Test the admin's actual editor workflow; click-to-edit is expected to be a desktop workflow.

## Handoff for the next agent

1. Read [HANDOFF.md](HANDOFF.md), this status, [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md), `DECISIONS.md`, `SPEC.md`, and `ARCHITECTURE.md` before changing code.
2. Start with the ordered steps above; schema coverage and safe migration come before changing the site read path.
3. Work only on `feature/sanity`; do not change `main`, the deployed PoC, or `.pages.yml` as part of this port unless explicitly asked.
4. Read the current official Sanity Astro visual-editing guidance before implementing integration. Verify current provider and plan details rather than relying on old pricing notes.
5. Never request or commit tokens. Dávid should enter secrets directly into GitHub/Cloudflare secret settings; project ID and dataset name are configuration, not secrets.
6. Keep this status file current and update `SPEC.md`, `DECISIONS.md`, and `ARCHITECTURE.md` in the same change when behavior or decisions change.

For Dávid's account and launch tasks, use `GO-LIVE-CHECKLIST.md`. The admin-facing guide is a draft in `EDITING-GUIDE.md` and must be revised after the real Sanity UI is configured and tested.