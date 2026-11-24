// The fonts offered in Site settings → Fonts, as on the site (src/lib/fonts.ts; npm run check
// compares the two). Adding one needs code: the font package on the site, then both lists.
import { defineField } from 'sanity'

export const FONTS = [
  { id: 'platypi', name: 'Platypi' },
  { id: 'fraunces', name: 'Fraunces' },
  { id: 'playfair', name: 'Playfair Display' },
  { id: 'franklin', name: 'Libre Franklin' },
  { id: 'opensans', name: 'Open Sans' },
  { id: 'inter', name: 'Inter' },
  { id: 'manrope', name: 'Manrope' },
  { id: 'bricolage', name: 'Bricolage Grotesque' },
]

const KIND: Record<string, string> = {
  platypi: 'serif, sharp',
  fraunces: 'serif, soft',
  playfair: 'serif, elegant',
  franklin: 'sans-serif, strong',
  opensans: 'sans-serif, easy to read',
  inter: 'sans-serif, clean',
  manrope: 'sans-serif, rounded',
  bricolage: 'sans-serif, characterful',
}

const fontField = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    description: `${description} Empty: the usual font.`,
    type: 'string',
    options: { list: FONTS.map((f) => ({ title: `${f.name} (${KIND[f.id]})`, value: f.id })) },
    fieldset: 'fonts',
  })

export const fontFields = [
  fontField('titleFont', 'Page titles', 'The big title in the band at the top of each page, e.g. "Your daily rhythm...". Usual: Platypi.'),
  fontField('headingFont', 'Headings and large text', 'Headings in the page, people\'s names, the community headline and Large text. Usual: Fraunces.'),
  fontField('boldFont', 'Menu, buttons and bold labels', 'The menu, buttons, the festival banner, banner titles, small headings and the numbers line. Usual: Libre Franklin.'),
  fontField('textFont', 'Body text', 'Ordinary paragraphs and bios. Usual: Open Sans.'),
]
