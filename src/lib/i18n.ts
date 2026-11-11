// Languages and the short fixed wording of the site (menu words, messages).
// Longer texts and headings are content: they live in src/content and are edited in the forms.
// To add a wording: add the same key to every language below.

export const LANGS = ['en', 'hu'] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);

/** Shown in the language switcher. */
export const LANG_LABEL: Record<Lang, string> = { en: 'EN', hu: 'HU' };
export const LANG_NAME: Record<Lang, string> = { en: 'English', hu: 'Magyar' };

export const UI: Record<Lang, Record<string, string>> = {
  en: {
    skip: 'Skip to content',
    menu: 'Menu',
    language: 'Language',
    home: 'Home',
    program: 'Program',
    teachers: 'Teachers',
    artists: 'Artists',
    tickets: 'Tickets',
    toFestival: 'Go to the festival',
    instagram: 'Instagram',
    notFoundTitle: 'Page not found',
    notFoundText: 'This address does not exist.',
    notFoundLink: 'Go to the home page',
  },
  hu: {
    skip: 'Ugrás a tartalomra',
    menu: 'Menü',
    language: 'Nyelv',
    home: 'Főoldal',
    program: 'Program',
    teachers: 'Tanárok',
    artists: 'Előadók',
    tickets: 'Jegyek',
    toFestival: 'Tovább a fesztiválra',
    instagram: 'Instagram',
    notFoundTitle: 'Az oldal nem található',
    notFoundText: 'Ez a cím nem létezik.',
    notFoundLink: 'Vissza a főoldalra',
  },
};

/**
 * Reads a two-language field: tr(person, 'bio', 'hu') returns bio_hu, or bio_en when
 * the Hungarian text is empty, so a missing translation never leaves a gap.
 */
export function tr(obj: Record<string, unknown> | null | undefined, key: string, lang: Lang): string {
  if (!obj) return '';
  const own = obj[`${key}_${lang}`];
  if (typeof own === 'string' && own.trim() !== '') return own;
  for (const other of LANGS) {
    const v = obj[`${key}_${other}`];
    if (typeof v === 'string' && v.trim() !== '') return v;
  }
  return '';
}
