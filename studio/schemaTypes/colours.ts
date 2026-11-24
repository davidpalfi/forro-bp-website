// One colour of the palette (Site settings → Colours): a name, its code and the text colour
// used on it. A built-in colour keeps its id ("builtin"), so pages that use it follow its code.
import { createElement } from 'react'
import { defineField, defineType } from 'sanity'
import { HEX } from './palette'

const hexRule = (rule: { custom: (fn: (v: unknown) => true | string) => unknown }) =>
  rule.custom((v) => (v === undefined || v === '' || (typeof v === 'string' && HEX.test(v.trim())) ? true : 'A colour code like #c28f32'))

export const paletteColour = defineType({
  name: 'paletteColour',
  title: 'Colour',
  type: 'object',
  fields: [
    defineField({ name: 'builtin', title: 'Built-in colour', type: 'string', hidden: true, readOnly: true }),
    defineField({ name: 'name', title: 'Name', description: 'Shown in every colour choice, e.g. "Mustard".', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'code',
      title: 'Colour code',
      description: 'The exact colour, e.g. #c28f32.',
      type: 'string',
      validation: (rule) => [rule.required(), hexRule(rule as never) as never],
    }),
    defineField({
      name: 'text',
      title: 'Text colour on it (optional)',
      description: 'The colour of text on this background, e.g. #2e2e2e. Empty: dark grey or cream, whichever reads better.',
      type: 'string',
      validation: (rule) => hexRule(rule as never) as never,
    }),
  ],
  preview: {
    select: { title: 'name', code: 'code', builtin: 'builtin' },
    prepare: ({ title, code, builtin }) => ({
      title: title || code || 'Colour',
      subtitle: `${code ?? ''}${builtin ? ' · built-in' : ''}`,
      media: () => createElement('span', { style: { display: 'block', width: '100%', height: '100%', background: code || 'transparent' } }),
    }),
  },
})
