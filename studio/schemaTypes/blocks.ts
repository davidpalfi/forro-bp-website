import { defineArrayMember, defineField, defineType } from 'sanity'
import { blockStyleFields, imageWithAlt, localizedFields, richText } from './shared'

const heading = localizedFields('heading', 'Heading')
const body = localizedFields('body', 'Text', 'richText')
const caption = localizedFields('caption', 'Caption')
const title = localizedFields('title', 'Title')
const label = localizedFields('label', 'Button label')

const pageColumn = defineType({
  name: 'pageColumn',
  title: 'Column',
  type: 'object',
  fieldsets: [body.fieldset],
  fields: body.fields,
  preview: {
    select: { title: 'body_en.0.children.0.text' },
    prepare: ({ title: previewTitle }) => ({ title: previewTitle || 'Column' }),
  },
})

const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  fieldsets: [heading.fieldset],
  fields: [
    ...heading.fields,
    defineField({
      name: 'level',
      title: 'Heading level',
      type: 'number',
      options: { list: [2, 3, 4] },
      initialValue: 2,
    }),
    ...blockStyleFields(),
  ],
})

const textBlock = defineType({
  name: 'textBlock',
  title: 'Text',
  type: 'object',
  fieldsets: [body.fieldset],
  fields: [...body.fields, ...blockStyleFields()],
})

const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'object',
  fieldsets: [caption.fieldset],
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'imageWithAlt', validation: (rule) => rule.required() }),
    ...caption.fields,
    ...blockStyleFields(),
  ],
})

const galleryBlock = defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  fieldsets: [caption.fieldset],
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [defineArrayMember({ type: 'imageWithAlt' })],
      validation: (rule) => rule.min(1),
    }),
    ...caption.fields,
    ...blockStyleFields(),
  ],
})

const buttonBlock = defineType({
  name: 'buttonBlock',
  title: 'Button',
  type: 'object',
  fieldsets: [label.fieldset],
  fields: [
    ...label.fields,
    defineField({ name: 'url', title: 'Link URL', type: 'string', validation: (rule) => rule.required() }),
    ...blockStyleFields(),
  ],
})

const bannerBlock = defineType({
  name: 'bannerBlock',
  title: 'Banner',
  type: 'object',
  fieldsets: [title.fieldset, body.fieldset, label.fieldset],
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'imageWithAlt' }),
    ...title.fields,
    ...body.fields,
    ...label.fields,
    defineField({ name: 'url', title: 'Button URL', type: 'string' }),
    ...blockStyleFields(),
  ],
})

const pageColumnArrayMember = defineArrayMember({ type: 'pageColumn' })

const columnsBlock = defineType({
  name: 'columnsBlock',
  title: 'Columns',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      of: [pageColumnArrayMember],
      validation: (rule) => rule.min(2).max(4),
    }),
    ...blockStyleFields(),
  ],
})

const videoBlock = defineType({
  name: 'videoBlock',
  title: 'Video',
  type: 'object',
  fieldsets: [caption.fieldset],
  fields: [
    defineField({ name: 'url', title: 'Video URL', type: 'url', validation: (rule) => rule.required() }),
    ...caption.fields,
    ...blockStyleFields(),
  ],
})

const dividerBlock = defineType({
  name: 'dividerBlock',
  title: 'Divider',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: { list: ['line', 'space'] },
      initialValue: 'line',
    }),
    ...blockStyleFields(),
  ],
})

const peopleGridBlock = defineType({
  name: 'peopleGridBlock',
  title: 'People grid',
  type: 'object',
  fields: [
    defineField({
      name: 'people',
      title: 'People',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
    }),
    defineField({
      name: 'group',
      title: 'Filter by group',
      type: 'string',
      options: { list: [{ title: 'All', value: 'all' }, { title: 'Teachers', value: 'Teacher' }, { title: 'Artists', value: 'Artist' }] },
      initialValue: 'all',
    }),
    ...blockStyleFields(),
  ],
})

export const blockTypes = [
  richText,
  imageWithAlt,
  pageColumn,
  headingBlock,
  textBlock,
  imageBlock,
  galleryBlock,
  buttonBlock,
  bannerBlock,
  columnsBlock,
  videoBlock,
  dividerBlock,
  peopleGridBlock,
]

export const pageBlockMembers = [
  'headingBlock',
  'textBlock',
  'imageBlock',
  'galleryBlock',
  'buttonBlock',
  'bannerBlock',
  'columnsBlock',
  'videoBlock',
  'dividerBlock',
  'peopleGridBlock',
].map((type) => defineArrayMember({ type }))