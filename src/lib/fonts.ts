// The fonts the editor can choose from (Site settings → Fonts) and the four kinds of text
// they apply to. Every font is self-hosted from an @fontsource-variable package imported in
// Base.astro; a browser only downloads the ones a page uses. Keep the ids and names in step
// with studio/schemaTypes/fonts.ts (npm run check compares them).
export type FontKind = 'serif' | 'sans';
export const FONTS: { id: string; name: string; family: string; kind: FontKind }[] = [
  { id: 'platypi', name: 'Platypi', family: 'Platypi Variable', kind: 'serif' },
  { id: 'fraunces', name: 'Fraunces', family: 'Fraunces Variable', kind: 'serif' },
  { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display Variable', kind: 'serif' },
  { id: 'franklin', name: 'Libre Franklin', family: 'Libre Franklin Variable', kind: 'sans' },
  { id: 'opensans', name: 'Open Sans', family: 'Open Sans Variable', kind: 'sans' },
  { id: 'inter', name: 'Inter', family: 'Inter Variable', kind: 'sans' },
  { id: 'manrope', name: 'Manrope', family: 'Manrope Variable', kind: 'sans' },
  { id: 'bricolage', name: 'Bricolage Grotesque', family: 'Bricolage Grotesque Variable', kind: 'sans' },
];

const FALLBACK: Record<FontKind, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Helvetica Neue', Arial, sans-serif",
};

/** The CSS font-family value for a font id, or undefined for an unknown id. */
export function fontStack(id: string) {
  const f = FONTS.find((x) => x.id === id);
  return f ? `'${f.family}', ${FALLBACK[f.kind]}` : undefined;
}

/** The kinds of text: the Site settings field, the CSS variable in global.css, the default font. */
export const FONT_ROLES = [
  { field: 'titleFont', variable: '--title', label: 'Page titles', default: 'platypi' },
  { field: 'headingFont', variable: '--serif', label: 'Headings and large text', default: 'fraunces' },
  { field: 'boldFont', variable: '--sans', label: 'Menu, buttons and bold labels', default: 'franklin' },
  { field: 'textFont', variable: '--text', label: 'Body text', default: 'opensans' },
];
