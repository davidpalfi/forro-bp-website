# Editing the Site in Sanity

**Draft, not ready to send to the admin.** The Studio configuration and schemas are implemented, but the Studio has not been deployed or tested with the admin, content has not been imported, and preview/publishing are not implemented. Update this guide after the real account workflow is tested. The old root-level `EDITING-GUIDE.md` describes Pages CMS and does not apply to the Sanity version.

## Before editing

You will receive an invitation and the address for the Sanity editor from the site maintainer. You do not need to edit code or use GitHub. If you cannot sign in, stop and contact the maintainer rather than creating another account or repeatedly retrying.

## Planned editing flow

The eventual workflow is expected to be:

1. Open the Sanity editor and choose the page or item you want to change.
2. Edit the fields for the content. The proposed setup keeps English and Hungarian together; fill both when the page asks for both languages. If one is left empty, the site may show the other language as a fallback.
3. Upload or select images in the image fields. The proposed Sanity image setup may offer cropping; check the preview at phone and desktop sizes.
4. Open the visual preview, check the page, language, links, and images, then publish when ready.
5. Wait for the site rebuild and check the published page in both languages.

The schema currently provides paired English/Hungarian fields, page blocks (heading, text, image, gallery, button, banner, columns, video, divider, people grid), reusable people, and hotspot image fields. The exact labels, sign-in, draft/publish behavior, preview controls, image rules, and click-to-edit experience have not been tested. The steps above are not an operational guide until the maintainer verifies them against the deployed Studio and working site.

## If something looks wrong

Do not keep publishing repeated corrections if the result is unclear. Contact the maintainer with the page name, language, what you changed, and what you expected to see. The current proof of concept remains the fallback until the Sanity editor and site have been accepted.

## Maintainer: finalize this guide

After the editor trial, replace the draft workflow with screenshots or exact menu names from the tested interface. Cover adding/editing a person, editing a page, uploading/cropping images, program image ordering, previewing, publishing, and where to report a failed rebuild. Confirm the guide on the admin's phone before sending it.