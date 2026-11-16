# Sanity Port Status

Status as of 2026-11-16. This is the current progress record for the `feature/sanity` branch. Update it as work is completed; do not treat plans as implementation.

## Current checkpoint

- Branch: `feature/sanity`, created for the port from `main`.
- Latest commit: `e4c49b5` (`WIP: prepare Sanity port`). At that checkpoint, `git status` was clean and `git log --oneline main..HEAD` contained only this commit.
- The checkpoint adds exact-pinned Sanity, Portable Text, Astro Cloudflare/React, and related dependencies to `package.json` and `package-lock.json`; it adds the planning brief at repository root as [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md).
- A credential-pattern scan of the committed files found no secrets. No API token, project ID, dataset name, Cloudflare account setting, or production secret has been added to the repository.
- No Sanity schemas, Studio, migration script, content query, Astro integration, SSR preview, image integration, webhook, or deployment configuration has been implemented.
- No build or test was run for the dependency-only checkpoint. The original proof-of-concept checks described in `HANDOFF.md` were run on 2026-11-11 and do not validate this port.
- Dávid confirmed the plan and the four choices on 2026-11-16 (see "Confirmed choices"). Implementation starts once he has created the Sanity project and supplied the project ID and dataset name.
- The current worktree adds this status record, a go-live checklist, a provisional Sanity editing guide, and updates to the handoff, decisions, spec, architecture, and user-needs docs. These documentation changes are not part of `e4c49b5` and have not yet been committed; no application behavior changed.

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

None of these implementation items is complete yet. The documentation now records the planned acceptance criteria, not passing results.

## Confirmed choices (Dávid, 2026-11-16)

Settled; do not ask again. Details and reasons are in `DECISIONS.md`, "Sanity port decisions" (S1 to S4).

- **S1 Languages:** English and Hungarian side by side in each document, with the current fallback.
- **S2 Page content:** a full page builder. The admin can create pages; every page is a list of blocks (heading, text, image, gallery, button, banner, columns, video, divider, people grid) with a few style options; teachers and artists are reusable entries placed with the people grid block. This is wider than the brief's proposal.
- **S3 Editor:** Sanity Studio hosted by Sanity, not embedded in the site.
- **S4 Photos:** Sanity's image service, with cropping in the editor.

Dávid has also approved starting the implementation, in stages, once the Sanity project exists (project ID and dataset name).

## Still open or to verify

- Use Cloudflare for the SSR preview; decide whether it also hosts production.
- Choose the production rebuild provider and the exact webhook mechanism.
- Verify current Sanity free-plan limits, dataset visibility, roles/seats, visual-editing availability, and invited-editor sign-in before relying on them.
- Test the admin's actual editor workflow; click-to-edit is expected to be a desktop workflow.

## Handoff for the next agent

1. Read [SANITY-PORT-BRIEF.md](../SANITY-PORT-BRIEF.md), `HANDOFF.md`, `DECISIONS.md`, `SPEC.md`, and this file before changing code.
2. Build to the confirmed choices above. Resolve the items under "Still open or to verify" before locking the hosting workflow.
3. Work only on `feature/sanity`; do not change `main`, the deployed PoC, or `.pages.yml` as part of this port unless explicitly asked.
4. Read the current official Sanity Astro visual-editing guidance before implementing integration. Verify current provider and plan details rather than relying on old pricing notes.
5. Never request or commit tokens. Dávid should enter secrets directly into GitHub/Cloudflare secret settings; project ID and dataset name are configuration, not secrets.
6. Keep this status file current and update `SPEC.md`, `DECISIONS.md`, and `ARCHITECTURE.md` in the same change when behavior or decisions change.

For Dávid's account and launch tasks, use `GO-LIVE-CHECKLIST.md`. The admin-facing guide is a draft in `EDITING-GUIDE.md` and must be revised after the real Sanity UI is configured and tested.