import { defineConfig } from 'sanity'
import { structureTool, type StructureBuilder } from 'sanity/structure'
import { presentationTool, defineDocuments, defineLocations } from 'sanity/presentation'
import { schemaTypes } from './schemaTypes'
import { SINGLETONS } from './schemaTypes/documents'

// The site preview shown in "Edit on the page" (click-to-edit). The deployed Studio uses the
// preview on Cloudflare, whose address is in studio/.env.production (SANITY_STUDIO_PREVIEW_URL);
// `npm run studio` on a computer uses `npm run preview:edit` at localhost:4322.
const PREVIEW_URL = (process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4322').replace(/\/+$/, '')

// Where each document is seen on the site, both languages.
const both = (path: string) => [
  { title: 'English', href: `/en${path}` },
  { title: 'Magyar', href: `/hu${path}` },
]
const pageAddress = (section?: string, slug?: string) => (section === 'community' ? `/${slug}/` : `/festival/${slug}/`)

const singleton = (S: StructureBuilder, id: string, title: string) =>
  S.listItem()
    .id(id)
    .title(title)
    .child(S.document().schemaType(id).documentId(id).title(title))

const peopleIn = (S: StructureBuilder, title: string, group: string) =>
  S.listItem()
    .id(`people-${group}`)
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('person')
        .filter('_type == "person" && group == $group')
        .params({ group })
        .defaultOrdering([{ field: 'order', direction: 'asc' }])
        .initialValueTemplates([S.initialValueTemplateItem('person-in-group', { group })]),
    )

const pagesIn = (S: StructureBuilder, title: string, section: string) =>
  S.listItem()
    .id(`pages-${section}`)
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('page')
        .filter('_type == "page" && section == $section')
        .params({ section })
        .defaultOrdering([{ field: 'order', direction: 'asc' }])
        .initialValueTemplates([S.initialValueTemplateItem('page-in-section', { section })]),
    )

export default defineConfig({
  name: 'default',
  title: 'Forró Budapest',
  projectId: '8hc671sk',
  dataset: 'production',
  plugins: [
    structureTool({
      title: 'Content',
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            singleton(S, 'festivalSettings', 'Festival home page'),
            pagesIn(S, 'Festival pages', 'festival'),
            peopleIn(S, 'Teachers', 'Teacher'),
            peopleIn(S, 'Artists', 'Artist'),
            S.divider(),
            singleton(S, 'communitySettings', 'Community home page'),
            pagesIn(S, 'Community pages', 'community'),
            S.divider(),
            S.documentTypeListItem('person').title('Everyone (teachers and artists)'),
            singleton(S, 'siteSettings', 'Site settings'),
          ]),
    }),
    presentationTool({
      title: 'Edit on the page',
      previewUrl: {
        initial: `${PREVIEW_URL}/en/festival/`,
        // The preview lock: the Studio first opens this address with a one-hour secret, and
        // only then does the preview show drafts (src/lib/preview-lock.ts).
        previewMode: { enable: '/preview/enable/' },
      },
      resolve: {
        // Which document an address shows, so opening a page also opens its document.
        mainDocuments: defineDocuments([
          { route: '/:lang/festival/', filter: '_type == "festivalSettings"' },
          { route: '/:lang/festival/:slug/', filter: '_type == "page" && section == "festival" && slug.current == $slug' },
          { route: '/:lang/', filter: '_type == "communitySettings"' },
          { route: '/:lang/:slug/', filter: '_type == "page" && section == "community" && slug.current == $slug' },
        ]),
        // "Used on these pages" links shown above a document in the editor.
        locations: {
          festivalSettings: defineLocations({ message: 'The festival home page', locations: both('/festival/') }),
          communitySettings: defineLocations({ message: 'The community home page', locations: both('/') }),
          page: defineLocations({
            select: { title: 'title_en', slug: 'slug.current', section: 'section' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: both(pageAddress(doc.section, doc.slug)).map((l) => ({ ...l, title: `${doc.title || doc.slug} (${l.title})` })) }
                : null,
          }),
        },
      },
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev.filter((t) => !SINGLETONS.includes(t.schemaType)),
      {
        id: 'person-in-group',
        title: 'Person in group',
        schemaType: 'person',
        parameters: [{ name: 'group', type: 'string' }],
        value: (params: { group?: string }) => ({ group: params.group ?? 'Teacher' }),
      },
      {
        id: 'page-in-section',
        title: 'Page in section',
        schemaType: 'page',
        parameters: [{ name: 'section', type: 'string' }],
        value: (params: { section?: string }) => ({ section: params.section ?? 'festival', tone: 'red', showInMenu: true, order: 50 }),
      },
    ],
  },
  document: {
    // The three settings documents exist once each: they cannot be duplicated or deleted.
    actions: (prev, context) =>
      SINGLETONS.includes(context.schemaType)
        ? prev.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : prev,
    newDocumentOptions: (prev) =>
      prev.filter((item) => !SINGLETONS.includes(item.templateId) && !['person-in-group', 'page-in-section'].includes(item.templateId)),
  },
})
