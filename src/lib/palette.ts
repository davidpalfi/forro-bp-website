// The colour palette: the built-in colours and their defaults. Site settings → Colours can
// change each one's code and text colour and add new colours; pages, blocks, the header and
// the language list then choose from the palette by id. Keep in step with
// studio/schemaTypes/palette.ts (npm run check compares them).
export type Colour = { id: string; name: string; code: string; text: string; builtin: boolean };

export const BUILTIN_COLOURS: Omit<Colour, 'builtin'>[] = [
  { id: 'red', name: 'Festival red', code: '#c80a2f', text: '#f7e1b5' },
  { id: 'gold', name: 'Mustard', code: '#c28f32', text: '#2e2e2e' },
  { id: 'cream', name: 'Cream', code: '#f7e1b5', text: '#2f2e2e' },
  { id: 'light', name: 'Light cream', code: '#e9eadc', text: '#2e2e2e' },
  { id: 'dark', name: 'Dark', code: '#212121', text: '#f7e1b5' },
];

export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(hex: string) {
  const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio of two colour codes, 1 to 21. */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => p - q);
  return (y + 0.05) / (x + 0.05);
}
/** Dark grey or cream, whichever reads better on this background. */
export const autoText = (code: string) => (contrast(code, '#2e2e2e') >= contrast(code, '#f7e1b5') ? '#2e2e2e' : '#f7e1b5');
/** A safe id for a colour the editor added (from its list key). */
export const customId = (key: string) => `c${key.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
