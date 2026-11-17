import { defineConfig } from 'sanity'
import { structureTool, type StructureBuilder } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'

const singleton = (S: StructureBuilder, id: string, title: string, type: string) =>
  S.listItem()
    .id(id)
    .title(title)
    .child(S.document().schemaType(type).documentId(id))

export default defineConfig({
  name: 'default',
  title: 'Forro Budapest',
  projectId: '8hc671sk',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            singleton(S, 'siteSettings', 'Site settings', 'siteSettings'),
            singleton(S, 'communitySettings', 'Community settings', 'communitySettings'),
            singleton(S, 'festivalSettings', 'Festival settings', 'festivalSettings'),
            S.divider(),
            S.documentTypeListItem('page').title('Pages'),
            S.documentTypeListItem('person').title('People'),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
})