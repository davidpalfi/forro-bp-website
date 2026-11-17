import { defineConfig } from 'sanity'
import { structureTool, type StructureBuilder } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'
import { SINGLETONS } from './schemaTypes/documents'

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
