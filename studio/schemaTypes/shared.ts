import { defineField, defineType } from 'sanity'

export function localizedFields(
  name: string,
  title: string,
  type: 'string' | 'text' | 'richText' = 'string',
) {
  const fieldset = `${name}Translations`
  return {
    fieldset: { name: fieldset, title, options: { columns: 2 as const } },
    fields: [
      defineField({ name: `${name}_en`, title: 'English', type, fieldset }),
      defineField({ name: `${name}_hu`, title: 'Hungarian', type, fieldset }),
    ],
  }
}

export function blockStyleFields() {
  return [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Red', value: 'red' },
          { title: 'Cream', value: 'cream' },
          { title: 'Dark', value: 'dark' },
        ],
        layout: 'radio',
      },
      initialValue: 'default',
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
      },
      initialValue: 'left',
    }),
  ]
}

export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bulleted', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [defineField({ name: 'href', type: 'string', title: 'URL' })],
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
  fieldsets: [{ name: 'altText', title: 'Alternative text', options: { columns: 2 } }],
  fields: [
    defineField({ name: 'alt_en', title: 'English', type: 'string', fieldset: 'altText' }),
    defineField({ name: 'alt_hu', title: 'Hungarian', type: 'string', fieldset: 'altText' }),
  ],
})