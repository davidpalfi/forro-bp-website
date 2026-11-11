// The shape of the content. Every field is optional on purpose: a missing or empty
// field should never break the build and take the site down. The editing forms
// (.pages.yml) are where "required" is enforced.
//
// Two-language fields come in pairs: bio_en and bio_hu. Read them with tr() from lib/i18n.

import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { text, flag, num, textList } from './lib/schema';

// The file name (without extension) is the id, and for text pages also the address.
const idFromFile = ({ entry }: { entry: string }) => entry.replace(/\.[^.]+$/, '');

const people = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/people', generateId: idFromFile }),
  schema: z.object({
    name: text,
    group: text, // "Teacher" or "Artist": decides which page the person is on
    role_en: text,
    role_hu: text,
    photo: text,
    bio_en: text,
    bio_hu: text,
    instagram: text,
    order: num,
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages', generateId: idFromFile }),
  schema: z.object({
    title_en: text,
    title_hu: text,
    menuLabel_en: text,
    menuLabel_hu: text,
    body_en: text,
    body_hu: text,
    image: text,
    gallery: textList,
    showInMenu: flag(true),
    showOnHome: flag(false),
    order: num,
  }),
});

export const collections = { people, pages };
