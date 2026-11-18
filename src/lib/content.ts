// Everything the pages need from the content, in one place.
// Pages never read raw content; they call these helpers, which tolerate missing or odd
// fields and skip broken entries (with a [content-warning]) instead of failing the build.
//
// The content is a set of Sanity documents (site, community and festival settings, pages
// made of blocks, people), loaded once per build by source.ts: from Sanity itself, or from
// the JSON files converted by from-json.ts. Either way the pages see the same shapes.

import fs from 'node:fs';
import path from 'node:path';
import { portableTextToMarkdown } from '@portabletext/markdown';
import { createImageUrlBuilder } from '@sanity/image-url';
import { marked } from 'marked';
import { text, flag, num } from './schema.ts';
import { isLang, tr, LANGS, type Lang } from './i18n.ts';
import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';
import { loadDocuments, isPreview, SANITY, STUDIO_URL } from './source.ts';

/* ---------- Warnings ---------- */

const warned = new Set<string>();
export const warnOnce = (msg: string) => {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[content-warning] ${msg}`);
};

/* ---------- Loading ---------- */

type Obj = Record<string, unknown>;
const loaded = await loadDocuments(warnOnce);
export const contentSource = loaded.source;
let byId = new Map<string, Obj>();
const ofType = (type: string) => [...byId.values()].filter((d) => d._type === type);
const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown) => text.parse(v);
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []) as Obj[];

/* ---------- Settings ---------- */

export function getSite() {
  const s = asObj(byId.get('siteSettings'));
  const lang = str(s.defaultLang);
  const defaultLang: Lang = isLang(lang) ? lang : 'en';
  return {
    ...s,
    name: str(s.name) || 'Community',
    defaultLang,
    email: str(s.email),
    instagram: str(s.instagram),
    facebook: str(s.facebook),
    noindex: flag(true).parse(s.noindex),
  };
}

export function getCommunity() {
  const c = asObj(byId.get('communitySettings'));
  return { ...c, heroImage: c.heroImage, homeBlocks: list(c.homeBlocks) };
}

export function getFestival() {
  const f = asObj(byId.get('festivalSettings'));
  return {
    ...f,
    name: str(f.name) || 'Festival',
    ticketUrl: str(f.ticketUrl),
    instagram: str(f.instagram),
    homeBlocks: list(f.homeBlocks),
  };
}

/* ---------- Addresses and links ---------- */

/**
 * Puts the site's base path in front of a site-relative address ("/en/festival/").
 * The base is "/" on a custom domain and "/repo-name" on github.io/repo-name.
 * Never write a root-relative address by hand; always go through this.
 */
export function withBase(p: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return base + '/' + (p ?? '').replace(/^\/+/, '');
}

/** The address of a page in a language: href('hu', '/festival/program/') -> /hu/festival/program/ */
export function href(lang: Lang, pagePath = '/') {
  return withBase(`/${lang}/${pagePath.replace(/^\/+/, '')}`);
}

/** Addresses written in content that already name a language or a file folder are left alone. */
const LANGLESS = new RegExp(`^/(?!(?:${LANGS.join('|')})(?:/|$)|uploads/|_img/)`);

/**
 * Text written by editors may contain links like [Program](/en/festival/program/) and photos at
 * /uploads/x.jpg. This puts the base path in front of those in the finished HTML, and, when a
 * language is given, the language in front of site links written without one (/festival/).
 */
export function rebaseHtml(html: string, lang?: Lang) {
  let out = html;
  if (lang) out = out.replace(/(\shref=")(\/[^"]*)"/g, (m, a: string, p: string) => (LANGLESS.test(p) && !p.startsWith('//') ? `${a}/${lang}${p}"` : m));
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  if (!base) return out;
  return out.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${base}/`);
}

/** Only allow normal links. Anything else (e.g. "javascript:") is dropped. Site-relative links get the base path. */
export function safeUrl(u: unknown, lang?: Lang) {
  const v = str(u);
  if (!/^(https?:\/\/|mailto:|\/(?!\/))/i.test(v)) return '';
  if (!v.startsWith('/')) return v;
  return lang && LANGLESS.test(v) ? href(lang, v) : withBase(v);
}

/* ---------- Text ---------- */

/** Plain multi-line text: each blank-line-separated block is a paragraph. */
export function paragraphs(s: unknown) {
  return str(s)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** A text (Markdown or HTML) as finished HTML. */
export function renderBody(body: string, lang?: Lang) {
  if (!body || !body.trim()) return '';
  let html = '';
  try {
    html = marked.parse(body, { async: false }) as string;
  } catch {
    html = paragraphs(body)
      .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
      .join('\n');
  }
  // Editors are trusted, but a pasted "javascript:" link should still never reach visitors.
  html = html.replace(/\s(href|src)="\s*(?:javascript|data|vbscript):[^"]*"/gi, '');
  return rebaseHtml(html, lang);
}

/** Sanity rich text (Portable Text) as finished HTML; a plain string is treated as Markdown. */
export function renderRich(value: unknown, lang: Lang) {
  if (typeof value === 'string') return renderBody(value, lang);
  if (!Array.isArray(value) || value.length === 0) return '';
  try {
    return renderBody(portableTextToMarkdown(value as never), lang);
  } catch (e) {
    warnOnce(`a text could not be shown: ${(e as Error).message}`);
    return '';
  }
}

/** The plain text of a rich text, e.g. for a one-line statement. */
export function richPlain(value: unknown) {
  if (typeof value === 'string') return value;
  return list(value)
    .map((b) => list(b.children).map((c) => str(c.text)).join(''))
    .filter(Boolean)
    .join('\n\n');
}

/** A two-language rich-text field: the visitor's language, else the other one. */
export function trRich(obj: Obj, key: string, lang: Lang): unknown {
  const filled = (v: unknown) => (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) && richPlain(v).trim() !== '');
  if (filled(obj[`${key}_${lang}`])) return obj[`${key}_${lang}`];
  for (const l of LANGS) if (filled(obj[`${key}_${l}`])) return obj[`${key}_${l}`];
  return undefined;
}

/**
 * The first of several two-language fields that is filled in, preferring the visitor's
 * language over the field order: trFirst(page, ['heading', 'title'], 'hu') tries heading_hu,
 * title_hu, then heading_en, title_en.
 */
export function trFirst(obj: Obj | null | undefined, fields: string[], lang: Lang) {
  if (!obj) return '';
  for (const l of [lang, ...LANGS.filter((x) => x !== lang)]) {
    for (const f of fields) {
      const v = obj[`${f}_${l}`];
      if (typeof v === 'string' && v.trim() !== '') return v;
    }
  }
  return '';
}

/* ---------- People ---------- */

const GROUPS = { teacher: 'teacher', artist: 'artist' } as const;
export type Group = keyof typeof GROUPS;

const makePeople = () =>
  ofType('person')
    .map((d) => {
      const g = str(d.group).toLowerCase();
      if (!(g in GROUPS)) warnOnce(`person "${d._id}" has no group (Teacher or Artist) and is shown with the teachers`);
      return {
        ...d,
        id: d._id as string,
        name: str(d.name) || String(d._id).replace(/^person-/, ''),
        group: (g in GROUPS ? g : 'teacher') as Group,
        instagram: str(d.instagram),
        order: num.parse(d.order) ?? 100,
      };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
export type Person = ReturnType<typeof makePeople>[number];
let allPeople: Person[] = [];

export function getPeople(group?: Group) {
  return group ? allPeople.filter((p) => p.group === group) : allPeople;
}

/** The people a "People" block shows: the chosen ones in their order, or everyone in the group. */
export function peopleForBlock(block: Obj) {
  const g = str(block.group).toLowerCase();
  const chosen = list(block.people)
    .map((r) => allPeople.find((p) => p.id === r._ref))
    .filter((p): p is Person => Boolean(p));
  if (chosen.length) return chosen;
  return g in GROUPS ? getPeople(g as Group) : allPeople;
}

/* ---------- Pages ---------- */

export type Section = 'community' | 'festival';
/** Addresses the site itself uses; a page with one of these is skipped. */
export const RESERVED: Record<Section, string[]> = { festival: [], community: ['festival'] };

const makePages = () => {
  const seen = new Set<string>();
  const out = [];
  const sorted = ofType('page')
    .map((d) => ({ d, order: num.parse(d.order) ?? 100 }))
    .sort((a, b) => a.order - b.order || String(a.d._id).localeCompare(String(b.d._id)));
  for (const { d, order } of sorted) {
    const slug = str(asObj(d.slug).current).toLowerCase();
    const section: Section = str(d.section) === 'community' ? 'community' : 'festival';
    const name = trFirst(d, ['title'], 'en') || slug || String(d._id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      warnOnce(`page "${name}" has no usable address and was skipped`);
      continue;
    }
    if (RESERVED[section].includes(slug)) {
      warnOnce(`page "${name}" uses a reserved address (${slug}) and was skipped`);
      continue;
    }
    if (seen.has(`${section}/${slug}`)) {
      warnOnce(`page "${name}" has the same address as another page (${slug}) and was skipped`);
      continue;
    }
    seen.add(`${section}/${slug}`);
    const tone = str(d.tone);
    out.push({
      ...d,
      id: d._id as string,
      slug,
      section,
      path: section === 'festival' ? `/festival/${slug}/` : `/${slug}/`,
      tone: (['red', 'cream', 'dark'].includes(tone) ? tone : 'red') as 'red' | 'cream' | 'dark',
      title_en: trFirst(d, ['title'], 'en') || slug,
      title_hu: trFirst(d, ['title'], 'hu') || slug,
      showInMenu: flag(true).parse(d.showInMenu),
      order,
      blocks: list(d.blocks),
    });
  }
  return out;
};
export type Page = ReturnType<typeof makePages>[number];
let allPages: Page[] = [];

export function getPages(section: Section = 'festival') {
  return allPages.filter((p) => p.section === section);
}

/** Where a button or banner leads: the chosen page in the visitor's language, else its address. */
export function blockLink(block: Obj, lang: Lang) {
  const ref = str(asObj(block.page)._ref);
  if (ref) {
    const target = allPages.find((p) => p.id === ref);
    if (target) return { url: href(lang, target.path), label: trFirst(target, ['menuLabel', 'title'], lang), external: false };
    warnOnce(`a button points to a page that is not published (${ref})`);
  }
  const url = safeUrl(block.url, lang);
  if (str(block.url) && !url) warnOnce(`the link "${str(block.url)}" is not a usable address and was left out`);
  return { url, label: '', external: /^https?:\/\//i.test(url) };
}

/* ---------- Images ---------- */

type Manifest = Record<string, { width: number; height: number; variants: { w: number; url: string }[] }>;
let manifest: Manifest | null = null;

function loadManifest(): Manifest {
  if (manifest) return manifest;
  try {
    const file = path.join(process.cwd(), 'public', '_img', 'manifest.json');
    manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest;
  } catch {
    manifest = {};
  }
  return manifest;
}

export type ResolvedImage = { src: string; srcset?: string; width?: number; height?: number; position?: string };

const WIDTHS = [480, 960, 1600];
const sanityImages = createImageUrlBuilder({ projectId: SANITY.projectId, dataset: SANITY.dataset });

/** A photo in public/uploads: web-sized variants when the build made them, else the original. */
function localImage(src: string): ResolvedImage | undefined {
  let clean = src;
  try {
    clean = decodeURI(src);
  } catch {
    /* keep as is */
  }
  const local = '/' + clean.replace(/^\/+/, '');
  const found = loadManifest()[local];
  if (!found || found.variants.length === 0) {
    if (/^https?:\/\//i.test(src)) return { src };
    // A path to a photo that no longer exists would show a broken image, so show nothing instead.
    const onDisk = path.join(process.cwd(), 'public', local);
    if (!fs.existsSync(onDisk)) {
      warnOnce(`photo "${src}" was not found in public/uploads and was left out`);
      return undefined;
    }
    return { src: withBase(local) };
  }
  const largest = found.variants[found.variants.length - 1];
  return {
    src: withBase(largest.url),
    srcset: found.variants.map((v) => `${withBase(v.url)} ${v.w}w`).join(', '),
    width: found.width,
    height: found.height,
  };
}

/** A photo uploaded to Sanity, served by Sanity's image service with the editor's crop. */
function sanityImage(image: Obj, ref: string): ResolvedImage | undefined {
  const m = /^image-[A-Za-z0-9]+-(\d+)x(\d+)-[a-z0-9]+$/.exec(ref);
  if (!m) {
    warnOnce(`a photo has an unexpected reference (${ref}) and was left out`);
    return undefined;
  }
  const crop = asObj(image.crop);
  const c = (k: string) => Math.min(Math.max(Number(crop[k]) || 0, 0), 1);
  const width = Math.max(1, Math.round(Number(m[1]) * (1 - c('left') - c('right'))));
  const height = Math.max(1, Math.round(Number(m[2]) * (1 - c('top') - c('bottom'))));
  const widths = WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS[WIDTHS.length - 1]));
  const url = (w: number) => sanityImages.image(image as never).width(w).fit('max').auto('format').url();
  const hotspot = asObj(image.hotspot);
  let position: string | undefined;
  if (typeof hotspot.x === 'number' && typeof hotspot.y === 'number') {
    // The hotspot is relative to the whole photo; object-position needs it relative to the crop.
    const x = (hotspot.x - c('left')) / (1 - c('left') - c('right') || 1);
    const y = (hotspot.y - c('top')) / (1 - c('top') - c('bottom') || 1);
    position = `${Math.round(Math.min(Math.max(x, 0), 1) * 100)}% ${Math.round(Math.min(Math.max(y, 0), 1) * 100)}%`;
  }
  return {
    src: url(widths[widths.length - 1]),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width,
    height,
    position,
  };
}

/**
 * Any photo the content can hold, ready for an <img>: a Sanity image (uploaded, or one from
 * the JSON files not uploaded yet) or a plain /uploads/ path. Nothing when it is missing.
 */
export function getImage(image: unknown): ResolvedImage | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return localImage(image);
  const o = asObj(image);
  if (typeof o._upload === 'string') return localImage(o._upload);
  const asset = asObj(o.asset);
  if (typeof asset._ref === 'string') return sanityImage(o, asset._ref);
  // A photo within a photo, as the first import of 2026-11-18 made them: still shown, but the
  // document should be imported again (npm run sanity:import-replace) or the photo chosen again.
  const inner = asObj(asset.asset);
  if (typeof inner._ref === 'string') {
    warnOnce('some photos in Sanity are stored the wrong way (from the first import); run "npm run sanity:import-replace" once');
    return sanityImage({ ...asset, ...o, asset: inner }, inner._ref);
  }
  // An import file that has not been imported yet: image@file://./images/x.jpg is public/uploads/x.jpg
  const pending = /^image@file:\/\/\.\/images\/(.+)$/.exec(str(o._sanityAsset));
  if (pending) return localImage(`/uploads/${pending[1]}`);
  return undefined;
}

/* ---------- Click-to-edit targets for photos (preview only) ---------- */

// Texts carry invisible markers that say which field they come from; photos cannot, so in
// the preview every photo object is noted with its document and field, and the <img> gets a
// data-sanity attribute. Public builds note nothing and print no attribute.
let photoTargets = new WeakMap<object, string>();

function notePhotos(doc: Obj) {
  const edit = createDataAttribute({ id: String(doc._id), type: String(doc._type), baseUrl: STUDIO_URL });
  const walk = (value: unknown, path: (string | { _key: string })[]) => {
    if (Array.isArray(value)) {
      // Items without a key cannot be addressed reliably, so they get no click target.
      for (const item of value) {
        const key = item && typeof item === 'object' ? (item as Obj)._key : undefined;
        if (typeof key === 'string') walk(item, [...path, { _key: key }]);
      }
    } else if (value && typeof value === 'object') {
      const o = value as Obj;
      if (path.length && o.asset && typeof o.asset === 'object') photoTargets.set(o, edit(path as never).toString());
      for (const [k, v] of Object.entries(o)) if (!k.startsWith('_') && k !== 'asset') walk(v, [...path, k]);
    }
  };
  walk(doc, []);
}

/** The data-sanity attribute that makes a photo clickable in the preview; nothing otherwise. */
export const editAttr = (image: unknown) => (image && typeof image === 'object' ? photoTargets.get(image) : undefined);

/** The description of a photo for screen readers, in the visitor's language. */
export const altOf = (image: unknown, lang: Lang) => tr(asObj(image), 'alt', lang);

/* ---------- Blocks ---------- */

export type Block = Obj & { _type: string; _key?: string };

/**
 * Consecutive blocks with the same background and alignment share one band, so a heading,
 * its text and a button sit together instead of in separate stripes.
 */
export function groupBlocks(blocks: Obj[], tone: string) {
  const groups: { background: string; alignment: string; blocks: Block[] }[] = [];
  for (const b of blocks) {
    if (typeof b._type !== 'string') continue;
    const bg = str(b.background);
    const background = ['red', 'cream', 'dark'].includes(bg) ? bg : tone;
    const al = str(b.alignment);
    const alignment = ['center', 'right'].includes(al) ? al : 'left';
    const last = groups[groups.length - 1];
    if (last && last.background === background && last.alignment === alignment) last.blocks.push(b as Block);
    else groups.push({ background, alignment, blocks: [b as Block] });
  }
  return groups;
}

/** A YouTube or Vimeo address as an embeddable player address; '' for anything else. */
export function videoEmbed(url: unknown) {
  const u = safeUrl(url);
  let m = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(u);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = /^https:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/.exec(u);
  if (m) return `https://player.vimeo.com/video/${m[1]}?dnt=1`;
  return '';
}

/* ---------- Which documents are shown ---------- */

/**
 * Makes these documents the content every helper above reads. A build calls it once (below);
 * the click-to-edit preview calls it on every request with the latest drafts
 * (src/middleware.ts). Pages never notice the difference.
 */
export function useDocuments(docs: unknown[]) {
  const next = new Map<string, Obj>();
  for (const d of docs) if (d && typeof d === 'object' && typeof (d as Obj)._id === 'string') next.set((d as Obj)._id as string, d as Obj);
  byId = next;
  photoTargets = new WeakMap();
  if (isPreview()) for (const d of next.values()) notePhotos(d);
  allPeople = makePeople();
  allPages = makePages();
}

useDocuments(loaded.docs);
