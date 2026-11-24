// The built-in colours of the palette, as on the site (src/lib/palette.ts; npm run check
// compares the two). Site settings → Colours can change their codes and add new colours.
export const BUILTIN_COLOURS = [
  { id: 'red', name: 'Festival red', code: '#c80a2f', text: '#f7e1b5' },
  { id: 'gold', name: 'Mustard', code: '#c28f32', text: '#2e2e2e' },
  { id: 'cream', name: 'Cream', code: '#f7e1b5', text: '#2f2e2e' },
  { id: 'light', name: 'Light cream', code: '#e9eadc', text: '#2e2e2e' },
  { id: 'dark', name: 'Dark', code: '#212121', text: '#f7e1b5' },
]

export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** A safe id for a colour the editor added (from its list key). */
export const customId = (key: string) => `c${key.toLowerCase().replace(/[^a-z0-9]/g, '')}`
