import { defineField, defineType } from 'sanity'

/**
 * Two fields side by side, English and Hungarian: localizedFields('bio', 'Biography')
 * gives bio_en and bio_hu in a two-column fieldset. If one is left empty, the site
 * shows the other language.
 */
export function localizedFields(
  name: string,
  title: string,
  type: 'string' | 'text' | 'richText' = 'string',
  description?: string,
) {
  const fieldset = `${name}Translations`
  return {
    fieldset: { name: fieldset, title, description, options: { columns: 2 as const } },
    fields: [
      defineField({ name: `${name}_en`, title: 'English', type, fieldset, ...(type === 'text' ? { rows: 4 } : {}) }),
      defineField({ name: `${name}_hu`, title: 'Magyar', type, fieldset, ...(type === 'text' ? { rows: 4 } : {}) }),
    ],
  }
}

/** Background and alignment, offered on every block. */
export function blockStyleFields() {
  return [
    defineField({
      name: 'background',
      title: 'Background',
      description: '"Same as page" keeps the page colour. The colours come from Site settings → Colours. On community pages Festival red shows as Mustard and Cream as Light cream. Blocks next to each other with the same background and alignment are joined into one band.',
      type: 'string',
      options: { colourPicker: 'block' } as never,
      initialValue: 'default',
      group: 'style',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      group: 'style',
    }),
  ]
}

/** Every block has a "Content" tab and a "Style" tab. */
export const blockGroups = [
  { name: 'content', title: 'Content', default: true },
  { name: 'style', title: 'Style' },
]

export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Small heading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bulleted', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                type: 'string',
                title: 'Address',
                description: 'A full address (https://…), an email (mailto:…), or a page of this site such as /festival/program/',
              }),
            ],
          },
        ],
      },
    },
  ],
})

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fieldsets: [
    {
      name: 'altText',
      title: 'Description for blind visitors (optional)',
      description: 'One short sentence saying what the photo shows.',
      options: { columns: 2, collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({ name: 'alt_en', title: 'English', type: 'string', fieldset: 'altText' }),
    defineField({ name: 'alt_hu', title: 'Magyar', type: 'string', fieldset: 'altText' }),
  ],
})

/** Addresses accepted in link fields: https://, mailto:, or a page of this site starting with "/". */
export function linkRule(value: unknown) {
  if (value === undefined || value === null || value === '') return true
  const v = String(value).trim()
  if (/^(https?:\/\/|mailto:|\/(?!\/))/i.test(v)) return true
  return 'Start with https://, mailto:, or / for a page of this site'
}
