// The shape of the content. Every field is optional on purpose: a missing or empty
// field should never break the build and take the site down. The editing forms
// (.pages.yml) are where "required" is enforced.

import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { text, flag, num, textList } from './lib/schema';

// Use the file name (without extension) as the id, so a stored reference like
// "src/content/people/ana-silva.json" matches the id "ana-silva".
const idFromFile = ({ entry }: { entry: string }) => entry.replace(/\.[^.]+$/, '');

const people = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/people', generateId: idFromFile }),
  schema: z.object({
    name: text,
    role: text,
    photo: text,
    country: text,
    bio: text,
    link: text,
    featured: flag(false),
    order: num,
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/events', generateId: idFromFile }),
  schema: z.object({
    title: text,
    date: text, // yyyy-MM-dd
    startTime: text,
    endTime: text,
    place: text,
    type: text,
    description: text,
    url: text,
    people: textList,
  }),
});

const links = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/links', generateId: idFromFile }),
  schema: z.object({
    label: text,
    url: text,
    kind: text,
    description: text,
    order: num,
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages', generateId: idFromFile }),
  schema: z.object({
    title: text,
    menuLabel: text,
    showInMenu: flag(true),
    order: num,
    image: text,
  }),
});

export const collections = { people, events, links, pages };
