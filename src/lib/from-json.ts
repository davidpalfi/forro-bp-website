// Turns the JSON content files (src/content) into Sanity documents.
//
// Used in two places, so they can never disagree:
//   - the site, when it reads the JSON files (CONTENT_SOURCE=json, the default), and
//   - scripts/make-sanity-import.mjs, which writes the import file for Sanity.
// Because the site's own test suite (npm run check) builds from these documents, the
// migration mapping is tested on every check.
//
// Runs in plain Node too (node strips the types), so it imports with ".ts" extensions and
// must not use Astro-only modules. Every field is forgiving, as before: odd values become
// empty, and problems are reported through `warn` instead of failing.

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { markdownToPortableText } from '@portabletext/markdown';
import { text, flag, num, textList } from './schema.ts';
import { UI } from './i18n.ts';

/* ---------- Forgiving shapes of the JSON files ---------- */

const SiteSchema = z.object({
  name: text,
  defaultLang: text,
  tagline_en: text,
  tagline_hu: text,
  email: text,
  instagram: text,
  facebook: text,
  footerNote_en: text,
  footerNote_hu: text,
  noindex: flag(true),
});

const CommunitySchema = z.object({ title_en: text, title_hu: text, heroImage: text, intro_en: text, intro_hu: text });

const FestivalSchema = z.object({
  name: text,
  logo: text,
  headerLogo: text,
  heroImage: text,
  heroImagePhone: text,
  tagline_en: text,
  tagline_hu: text,
  dateLine_en: text,
  dateLine_hu: text,
  ticketUrl: text,
  ticketLabel_en: text,
  ticketLabel_hu: text,
  intro_en: text,
  intro_hu: text,
  stats_en: text,
  stats_hu: text,
  instagram: text,
  programHeading_en: text,
  programHeading_hu: text,
  programImages: textList,
  programText_en: text,
  programText_hu: text,
  teachersHeading_en: text,
  teachersHeading_hu: text,
  artistsHeading_en: text,
  artistsHeading_hu: text,
});

const PersonSchema = z.object({
  name: text,
  group: text,
  role_en: text,
  role_hu: text,
  photo: text,
  bio_en: text,
  bio_hu: text,
  instagram: text,
  order: num,
});

const PageSchema = z.object({
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
});

/** Addresses under /festival/ that the built-in pages (program, teachers, artists) take. */
export const BUILT_IN_SLUGS = ['program', 'teachers', 'artists'];

/* ---------- Helpers ---------- */

export type Doc = Record<string, unknown> & { _id: string; _type: string };

/** Stable _key values, so a repeated import produces exactly the same documents. */
function keys(prefix: string) {
  let n = 0;
  return () => `${prefix}${(n++).toString(36).padStart(3, '0')}`;
}

/**
 * A photo from public/uploads, as a Sanity image that has not been uploaded yet.
 * `_upload` is replaced by a real asset when the import file is written; the site
 * shows the local file directly.
 */
function img(src: string, type = 'imageWithAlt', alt?: { en?: string; hu?: string }) {
  if (!src) return undefined;
  return { _type: type, _upload: src, ...(alt?.en ? { alt_en: alt.en } : {}), ...(alt?.hu ? { alt_hu: alt.hu } : {}) };
}

/** Markdown text (as saved by the old editor) as Portable Text, Sanity's rich text. */
export function richText(md: string, key: () => string) {
  if (!md.trim()) return undefined;
  return markdownToPortableText(md, { keyGenerator: key });
}

/** Plain text with blank-line paragraphs as Portable Text. */
function plainText(s: string, key: () => string) {
  const paras = s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return undefined;
  return paras.map((p) => ({
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text: p, marks: [] }],
  }));
}

function readJson(file: string): unknown {
  // A file with broken syntax fails the build on purpose (known limit); the host then keeps the previous version.
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readFolder(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ id: f.replace(/\.json$/, ''), raw: readJson(path.join(dir, f)) }));
}

/** Makes a file name safe to use in a Sanity document id (letters, digits, hyphens). */
const idPart = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unnamed';

/* ---------- The mapping ---------- */

export function jsonToDocuments(contentDir: string, warn: (msg: string) => void = () => {}): Doc[] {
  const settings = (name: string) => {
    const file = path.join(contentDir, 'settings', `${name}.json`);
    return fs.existsSync(file) ? readJson(file) : {};
  };
  const site = SiteSchema.parse(settings('site'));
  const community = CommunitySchema.parse(settings('community'));
  const festival = FestivalSchema.parse(settings('festival'));
  const docs: Doc[] = [];

  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    name: site.name,
    defaultLang: site.defaultLang,
    tagline_en: site.tagline_en,
    tagline_hu: site.tagline_hu,
    email: site.email,
    instagram: site.instagram,
    facebook: site.facebook,
    footerNote_en: site.footerNote_en,
    footerNote_hu: site.footerNote_hu,
    noindex: site.noindex,
  });

  {
    const k = keys('c');
    const intro_en = plainText(community.intro_en, k);
    const intro_hu = plainText(community.intro_hu, k);
    docs.push({
      _id: 'communitySettings',
      _type: 'communitySettings',
      title_en: community.title_en,
      title_hu: community.title_hu,
      heroImage: img(community.heroImage),
      homeBlocks:
        intro_en || intro_hu
          ? [{ _type: 'textBlock', _key: k(), body_en: intro_en, body_hu: intro_hu, look: 'large', background: 'default', alignment: 'left' }]
          : [],
    });
  }

  // Text pages first, because the festival home links to some of them.
  const textPages: Doc[] = [];
  const homeButtons: string[] = [];
  for (const { id, raw } of readFolder(path.join(contentDir, 'pages'))) {
    if (BUILT_IN_SLUGS.includes(id)) {
      warn(`text page "${id}" uses a reserved address and was skipped`);
      continue;
    }
    const p = PageSchema.parse(raw ?? {});
    const k = keys('p');
    const blocks: unknown[] = [];
    const body_en = richText(p.body_en, k);
    const body_hu = richText(p.body_hu, k);
    if (body_en || body_hu) blocks.push({ _type: 'textBlock', _key: k(), body_en, body_hu, look: 'normal', background: 'default', alignment: 'left' });
    const gallery = p.gallery.map((src) => ({ ...img(src), _key: k() }));
    if (gallery.length) blocks.push({ _type: 'galleryBlock', _key: k(), images: gallery, background: 'default', alignment: 'left' });
    const docId = `page-${idPart(id)}`;
    if (p.showOnHome) homeButtons.push(docId);
    textPages.push({
      _id: docId,
      _type: 'page',
      title_en: p.title_en,
      title_hu: p.title_hu,
      menuLabel_en: p.menuLabel_en,
      menuLabel_hu: p.menuLabel_hu,
      slug: { _type: 'slug', current: id },
      section: 'festival',
      tone: 'cream',
      coverImage: img(p.image),
      showInMenu: p.showInMenu,
      order: 10 + (p.order ?? 100),
      blocks,
    });
  }

  {
    const k = keys('f');
    const blocks: unknown[] = [];
    const intro_en = plainText(festival.intro_en, k);
    const intro_hu = plainText(festival.intro_hu, k);
    if (intro_en || intro_hu) blocks.push({ _type: 'textBlock', _key: k(), body_en: intro_en, body_hu: intro_hu, look: 'large', background: 'default', alignment: 'left' });
    const stats_en = plainText(festival.stats_en, k);
    const stats_hu = plainText(festival.stats_hu, k);
    if (stats_en || stats_hu) blocks.push({ _type: 'textBlock', _key: k(), body_en: stats_en, body_hu: stats_hu, look: 'statement', background: 'default', alignment: 'center' });
    for (const ref of homeButtons) {
      blocks.push({ _type: 'buttonBlock', _key: k(), page: { _type: 'reference', _ref: ref }, background: 'default', alignment: 'center' });
    }
    docs.push({
      _id: 'festivalSettings',
      _type: 'festivalSettings',
      name: festival.name,
      logo: img(festival.logo, 'image'),
      headerLogo: img(festival.headerLogo, 'image'),
      heroImage: img(festival.heroImage),
      heroImagePhone: img(festival.heroImagePhone),
      dateLine_en: festival.dateLine_en,
      dateLine_hu: festival.dateLine_hu,
      ticketUrl: festival.ticketUrl,
      ticketLabel_en: festival.ticketLabel_en,
      ticketLabel_hu: festival.ticketLabel_hu,
      instagram: festival.instagram,
      tagline_en: festival.tagline_en,
      tagline_hu: festival.tagline_hu,
      homeBlocks: blocks,
    });
  }

  // The three built-in festival pages become ordinary pages the admin can edit.
  {
    const k = keys('g');
    const name = festival.name || 'Festival';
    const blocks: unknown[] = festival.programImages.map((src, i) => ({
      _type: 'imageBlock',
      _key: k(),
      image: img(src, 'imageWithAlt', { en: `${UI.en.program} – ${name} (${i + 1})`, hu: `${UI.hu.program} – ${name} (${i + 1})` }),
      width: 'wide',
      background: 'default',
      alignment: 'center',
    }));
    const text_en = richText(festival.programText_en, k);
    const text_hu = richText(festival.programText_hu, k);
    if (text_en || text_hu) blocks.push({ _type: 'textBlock', _key: k(), body_en: text_en, body_hu: text_hu, look: 'normal', background: 'default', alignment: 'left' });
    const builtIn = (slug: string, order: number, heading: { en: string; hu: string }, content: unknown[]): Doc => ({
      _id: `page-${slug}`,
      _type: 'page',
      title_en: UI.en[slug],
      title_hu: UI.hu[slug],
      heading_en: heading.en,
      heading_hu: heading.hu,
      slug: { _type: 'slug', current: slug },
      section: 'festival',
      tone: 'red',
      showInMenu: true,
      order,
      blocks: content,
    });
    docs.push(
      builtIn('program', 1, { en: festival.programHeading_en, hu: festival.programHeading_hu }, blocks),
      builtIn('teachers', 2, { en: festival.teachersHeading_en, hu: festival.teachersHeading_hu }, [
        { _type: 'peopleGridBlock', _key: k(), group: 'Teacher', people: [], background: 'default', alignment: 'left' },
      ]),
      builtIn('artists', 3, { en: festival.artistsHeading_en, hu: festival.artistsHeading_hu }, [
        { _type: 'peopleGridBlock', _key: k(), group: 'Artist', people: [], background: 'default', alignment: 'left' },
      ]),
    );
  }
  docs.push(...textPages);

  for (const { id, raw } of readFolder(path.join(contentDir, 'people'))) {
    const p = PersonSchema.parse(raw ?? {});
    docs.push({
      _id: `person-${idPart(id)}`,
      _type: 'person',
      name: p.name || id,
      group: p.group,
      photo: img(p.photo),
      role_en: p.role_en,
      role_hu: p.role_hu,
      bio_en: p.bio_en,
      bio_hu: p.bio_hu,
      instagram: p.instagram,
      order: p.order ?? 100,
    });
  }

  // Leave out empty values, so the documents look like ones saved in the editor.
  return docs.map((d) => prune(d) as Doc);
}

function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(prune);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(v)) {
      if (val === undefined || val === '') continue;
      out[key] = prune(val);
    }
    return out;
  }
  return v;
}
