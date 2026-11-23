// The building blocks of a page. The admin adds, removes and reorders them.
// A new kind of block is a code change: add it here, in BLOCK_TYPES below, and render it in
// src/components/Blocks.astro (see docs/ARCHITECTURE.md, "Add a new block").
import { defineArrayMember, defineField, defineType } from 'sanity'
import { blockGroups, blockStyleFields, imageWithAlt, linkRule, localizedFields, richText } from './shared'

const heading = localizedFields('heading', 'Heading')
const body = localizedFields('body', 'Text', 'richText')
const caption = localizedFields('caption', 'Caption (optional)')
const title = localizedFields('title', 'Title')
const label = localizedFields('label', 'Button text')

/** Plain text of the first paragraph of a rich text, for list previews. */
const firstWords = (blocks: unknown) => {
  if (!Array.isArray(blocks)) return ''
  for (const b of blocks as { children?: { text?: string }[] }[]) {
    const t = (b.children ?? []).map((c) => c.text ?? '').join('').trim()
    if (t) return t.length > 80 ? t.slice(0, 80) + '…' : t
  }
  return ''
}

/** Where a button goes: a page of this site, or an address. */
const linkFields = (required: boolean) => [
  defineField({
    name: 'page',
    title: 'Go to a page of this site',
    type: 'reference',
    to: [{ type: 'page' }],
    group: 'content',
  }),
  defineField({
    name: 'url',
    title: '…or an address',
    description: 'Used when no page is chosen above. https://… for another website, mailto:… for an email.',
    type: 'string',
    group: 'content',
    validation: (rule) =>
      rule.custom((value, context) => {
        const parent = context.parent as { page?: unknown } | undefined
        if (required && !value && !parent?.page) return 'Choose a page or type an address'
        return linkRule(value)
      }),
  }),
]

const pageColumn = defineType({
  name: 'pageColumn',
  title: 'Column',
  type: 'object',
  fieldsets: [heading.fieldset, body.fieldset],
  fields: [defineField({ name: 'image', title: 'Image (optional)', type: 'imageWithAlt' }), ...heading.fields, ...body.fields],
  preview: {
    select: { h: 'heading_en', hh: 'heading_hu', body: 'body_en', bodyHu: 'body_hu', media: 'image' },
    prepare: ({ h, hh, body: b, bodyHu, media }) => ({ title: h || hh || firstWords(b) || firstWords(bodyHu) || 'Column', media }),
  },
})

const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  groups: blockGroups,
  fieldsets: [heading.fieldset],
  fields: [
    ...heading.fields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'level',
      title: 'Size',
      type: 'number',
      options: { list: [{ title: 'Large', value: 2 }, { title: 'Medium', value: 3 }, { title: 'Small', value: 4 }], layout: 'radio', direction: 'horizontal' },
      initialValue: 2,
      group: 'style',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { en: 'heading_en', hu: 'heading_hu' },
    prepare: ({ en, hu }) => ({ title: en || hu || 'Heading', subtitle: 'Heading' }),
  },
})

const textBlock = defineType({
  name: 'textBlock',
  title: 'Text',
  type: 'object',
  groups: blockGroups,
  fieldsets: [body.fieldset],
  fields: [
    ...body.fields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'look',
      title: 'Text style',
      description: 'Large: big serif paragraphs, like the festival introduction. Statement: one bold line, like the numbers line.',
      type: 'string',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'Large', value: 'large' },
          { title: 'Statement', value: 'statement' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'normal',
      group: 'style',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { en: 'body_en', hu: 'body_hu' },
    prepare: ({ en, hu }) => ({ title: firstWords(en) || firstWords(hu) || 'Text', subtitle: 'Text' }),
  },
})

const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'object',
  groups: blockGroups,
  fieldsets: [caption.fieldset],
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'imageWithAlt', validation: (rule) => rule.required(), group: 'content' }),
    ...caption.fields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      options: { list: [{ title: 'Wide', value: 'wide' }, { title: 'Text width', value: 'text' }, { title: 'Full screen width', value: 'full' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'wide',
      group: 'style',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { media: 'image', en: 'caption_en', hu: 'caption_hu' },
    prepare: ({ media, en, hu }) => ({ title: en || hu || 'Image', subtitle: 'Image', media }),
  },
})

const galleryBlock = defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  groups: blockGroups,
  fieldsets: [caption.fieldset],
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      description: 'Drag to reorder. Visitors can click a photo to see it large and page through the rest.',
      type: 'array',
      of: [defineArrayMember({ type: 'imageWithAlt' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.min(1),
      group: 'content',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      description: 'Grid: same-size photos, three in a row (two on phones). Mosaic: big and small photos mixed, as on the Location page (works best with 5 or 10 photos).',
      type: 'string',
      options: { list: [{ title: 'Grid', value: 'grid' }, { title: 'Mosaic', value: 'mosaic' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'grid',
      group: 'content',
    }),
    ...caption.fields.map((f) => ({ ...f, group: 'content' })),
    ...blockStyleFields(),
  ],
  preview: {
    select: { images: 'images', media: 'images.0' },
    prepare: ({ images, media }) => ({ title: 'Gallery', subtitle: `${Array.isArray(images) ? images.length : 0} images`, media }),
  },
})

const buttonBlock = defineType({
  name: 'buttonBlock',
  title: 'Button',
  type: 'object',
  groups: blockGroups,
  fieldsets: [label.fieldset],
  fields: [...label.fields.map((f) => ({ ...f, group: 'content' })), ...linkFields(true), ...blockStyleFields()],
  preview: {
    select: { en: 'label_en', hu: 'label_hu', page: 'page.title_en', url: 'url' },
    prepare: ({ en, hu, page: p, url }) => ({ title: en || hu || p || 'Button', subtitle: `Button → ${p || url || '?'}` }),
  },
})

const bannerBlock = defineType({
  name: 'bannerBlock',
  title: 'Banner',
  type: 'object',
  groups: blockGroups,
  fieldsets: [title.fieldset, body.fieldset, label.fieldset],
  fields: [
    defineField({ name: 'image', title: 'Background image', type: 'imageWithAlt', group: 'content' }),
    ...title.fields.map((f) => ({ ...f, group: 'content' })),
    ...body.fields.map((f) => ({ ...f, group: 'content' })),
    ...label.fields.map((f) => ({ ...f, group: 'content' })),
    ...linkFields(false),
    ...blockStyleFields(),
  ],
  preview: {
    select: { en: 'title_en', hu: 'title_hu', media: 'image' },
    prepare: ({ en, hu, media }) => ({ title: en || hu || 'Banner', subtitle: 'Banner', media }),
  },
})

const columnsBlock = defineType({
  name: 'columnsBlock',
  title: 'Columns',
  type: 'object',
  groups: blockGroups,
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      description: '2 to 4 columns side by side on a computer; one under the other on a phone.',
      type: 'array',
      of: [defineArrayMember({ type: 'pageColumn' })],
      validation: (rule) => rule.min(2).max(4),
      group: 'content',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { columns: 'columns' },
    prepare: ({ columns }) => ({ title: 'Columns', subtitle: `${Array.isArray(columns) ? columns.length : 0} columns` }),
  },
})

const videoBlock = defineType({
  name: 'videoBlock',
  title: 'Video',
  type: 'object',
  groups: blockGroups,
  fieldsets: [caption.fieldset],
  fields: [
    defineField({
      name: 'url',
      title: 'Video address',
      description: 'Copy the address of a YouTube or Vimeo video from the browser.',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['https'] }),
      group: 'content',
    }),
    ...caption.fields.map((f) => ({ ...f, group: 'content' })),
    ...blockStyleFields(),
  ],
  preview: {
    select: { url: 'url' },
    prepare: ({ url }) => ({ title: 'Video', subtitle: url }),
  },
})

const dividerBlock = defineType({
  name: 'dividerBlock',
  title: 'Divider',
  type: 'object',
  groups: blockGroups,
  fields: [
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: { list: [{ title: 'Line', value: 'line' }, { title: 'Empty space', value: 'space' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'line',
      group: 'content',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { style: 'style' },
    prepare: ({ style }) => ({ title: style === 'space' ? 'Empty space' : 'Divider line' }),
  },
})

const peopleGridBlock = defineType({
  name: 'peopleGridBlock',
  title: 'People',
  type: 'object',
  groups: blockGroups,
  fields: [
    defineField({
      name: 'group',
      title: 'Who to show',
      description: 'With an empty list below, everyone in this group is shown, in their "Display order". Someone you add to People appears here by themselves.',
      type: 'string',
      options: { list: [{ title: 'Teachers', value: 'Teacher' }, { title: 'Artists', value: 'Artist' }, { title: 'Everyone', value: 'all' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'Teacher',
      group: 'content',
    }),
    defineField({
      name: 'people',
      title: 'Only these people (optional)',
      description: 'Pick people here to show only them, in this order.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
      group: 'content',
    }),
    ...blockStyleFields(),
  ],
  preview: {
    select: { group: 'group', people: 'people' },
    prepare: ({ group, people }) => ({
      title: 'People',
      subtitle: Array.isArray(people) && people.length ? `${people.length} chosen` : group === 'Artist' ? 'All artists' : group === 'all' ? 'Everyone' : 'All teachers',
    }),
  },
})

const eventCalendarBlock = defineType({
  name: 'eventCalendarBlock',
  title: 'Event calendar',
  type: 'object',
  groups: blockGroups,
  // Shows the months from "Event calendar" in the Studio menu, one at a time with arrows; it
  // opens on the current month and past months disappear by themselves. Only style settings here.
  fields: [...blockStyleFields()],
  preview: { prepare: () => ({ title: 'Event calendar', subtitle: 'The months from "Event calendar"' }) },
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
  eventCalendarBlock,
]

export const BLOCK_TYPES = [
  'textBlock',
  'headingBlock',
  'imageBlock',
  'galleryBlock',
  'buttonBlock',
  'peopleGridBlock',
  'bannerBlock',
  'columnsBlock',
  'videoBlock',
  'dividerBlock',
]

/** The blocks a month of the event calendar can hold: everything but another calendar. */
export const monthBlockMembers = BLOCK_TYPES.map((type) => defineArrayMember({ type }))
export const pageBlockMembers = [...BLOCK_TYPES, 'eventCalendarBlock'].map((type) => defineArrayMember({ type }))
