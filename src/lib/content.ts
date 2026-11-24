// Everything the pages need from the content, in one place.
// Pages never read raw content; they call these helpers, which tolerate missing or odd
// fields and skip broken entries (with a [content-warning]) instead of failing the build.
//
// The content is a set of Sanity documents (site, community and festival settings, pages
// made of blocks, people), loaded once per build by source.ts: from Sanity itself, or from
// the JSON files converted by from-json.ts. Either way the pages see the same shapes.

import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { portableTextToMarkdown } from '@portabletext/markdown';
import { createImageUrlBuilder } from '@sanity/image-url';
import { marked } from 'marked';
import { text, flag, num } from './schema.ts';
import { isLang, tr, LANGS, type Lang } from './i18n.ts';
import { FONT_ROLES, FONTS, fontStack } from './fonts.ts';
import { BUILTIN_COLOURS, HEX, autoText, contrast, customId, type Colour } from './palette.ts';
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
// The click-to-edit preview loads its own documents on each request and starts with none.
const loaded = isPreview() ? { source: 'sanity' as const, docs: [] } : await loadDocuments(warnOnce);
export const contentSource = loaded.source;

/** The documents being shown, and the lists made from them (see useDocuments at the end). */
type State = { byId: Map<string, Obj>; people: Person[]; pages: Page[]; menuLinks: MenuLink[]; photoTargets: WeakMap<object, string> };
const emptyState = (): State => ({ byId: new Map(), people: [], pages: [], menuLinks: [], photoTargets: new WeakMap() });
let shared: State = emptyState();
// In the preview each request renders with its own documents, so two requests running at the
// same time (one with drafts, one without) can never see each other's content.
const perRequest = new AsyncLocalStorage<State>();
const S = () => perRequest.getStore() ?? shared;
const ofType = (type: string, byId = S().byId) => [...byId.values()].filter((d) => d._type === type);
const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown) => text.parse(v);
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []) as Obj[];

/* ---------- Settings ---------- */

export function getSite() {
  const s = asObj(S().byId.get('siteSettings'));
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
  const c = asObj(S().byId.get('communitySettings'));
  return { ...c, heroImage: c.heroImage, homeBlocks: list(c.homeBlocks), heroButtons: list(c.heroButtons) as Block[] };
}

export function getFestival() {
  const f = asObj(S().byId.get('festivalSettings'));
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

/**
 * Plain multi-line text: each blank-line-separated block is a paragraph; a single line break
 * stays inside its paragraph. A line holding only invisible characters (zero-width spaces and
 * the like, which text copied from another site often carries) counts as blank.
 */
const INVISIBLE = '\\s\\u200B-\\u200D\\u2060\\uFEFF';
const BLANK_LINE = new RegExp(`\\n[${INVISIBLE}]*\\n`);
const EDGES = new RegExp(`^[${INVISIBLE}]+|[${INVISIBLE}]+$`, 'g');
export function paragraphs(s: unknown) {
  return str(s)
    .replace(/\r\n?|\u2028/g, '\n')
    .replace(/\u2029/g, '\n\n')
    .split(BLANK_LINE)
    .map((p) => p.trim())
    .filter((p) => p.replace(EDGES, ''));
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

const makePeople = (byId: Map<string, Obj>) =>
  ofType('person', byId)
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

export function getPeople(group?: Group) {
  return group ? S().people.filter((p) => p.group === group) : S().people;
}

/** The people a "People" block shows: the chosen ones in their order, or everyone in the group. */
export function peopleForBlock(block: Obj) {
  const g = str(block.group).toLowerCase();
  const chosen = list(block.people)
    .map((r) => S().people.find((p) => p.id === r._ref))
    .filter((p): p is Person => Boolean(p));
  if (chosen.length) return chosen;
  return g in GROUPS ? getPeople(g as Group) : S().people;
}

/* ---------- Event calendar ---------- */

/**
 * The months of an Event calendar block to build, in order: this month and later (each
 * visitor's browser then drops the months that are over, since the site is only rebuilt on
 * publish). A month without a year, month or usable picture, or a month given twice, is skipped.
 */
export function calendarMonths(block: Obj, now = new Date()) {
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seen = new Set<string>();
  const out = [];
  for (const m of list(block.months)) {
    const year = num.parse(m.year);
    const month = num.parse(m.month);
    if (!year || !month || month < 1 || month > 12 || !Number.isInteger(year) || !Number.isInteger(month)) {
      warnOnce('an event calendar month has no year or month and was skipped');
      continue;
    }
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!getImage(m.image)) {
      warnOnce(`the event calendar month ${key} has no picture and was skipped`);
      continue;
    }
    if (seen.has(key)) {
      warnOnce(`the event calendar has ${key} twice; only the first is shown`);
      continue;
    }
    seen.add(key);
    if (key >= current) out.push({ key, year, month, image: m.image });
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}
export type EventMonth = ReturnType<typeof calendarMonths>[number];

/** "2026. november" / "November 2026". */
export function monthName(m: EventMonth, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'hu' ? 'hu-HU' : 'en-GB', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(m.year, m.month - 1, 1));
}

/* ---------- Menu buttons that are not pages ---------- */

/**
 * Community "pages" whose "Menu button goes to" is the festival: a menu button with the page's
 * title or menu label and its menu order, linking to the festival home. Only the first is used.
 */
const makeMenuLinks = (byId: Map<string, Obj>) => {
  const links = ofType('page', byId)
    .filter((d) => str(d.section) === 'community' && str(d.goesTo) === 'festival')
    .map((d) => ({ ...d, id: String(d._id), path: '/festival/', order: num.parse(d.order) ?? 100, showInMenu: flag(true).parse(d.showInMenu) }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  if (links.length > 1) warnOnce('more than one community page is a menu button to the festival; only the first is shown');
  return links.slice(0, 1);
};
export type MenuLink = ReturnType<typeof makeMenuLinks>[number];

/** The community menu's button to the festival, when one is set up as a page; else undefined. */
export function getFestivalMenuLink() {
  return S().menuLinks[0];
}

/* ---------- Colours ---------- */

/**
 * The palette: the built-in colours (src/lib/palette.ts) with the codes, names and text colours
 * set in Site settings → Colours, then the colours added there. A code that is not a colour code
 * is ignored with a warning; text that would be hard to read on its colour is a warning too.
 */
export function getPalette(byId = S().byId): Colour[] {
  const out: Colour[] = BUILTIN_COLOURS.map((c) => ({ ...c, builtin: true }));
  for (const item of list(asObj(byId.get('siteSettings')).colours)) {
    const name = str(item.name).trim();
    const code = str(item.code).trim();
    const builtin = str(item.builtin);
    const target = builtin ? out.find((c) => c.builtin && c.id === builtin) : undefined;
    const label = name || target?.name || code || 'a colour';
    if (!HEX.test(code)) {
      warnOnce(`the colour "${label}" has no usable colour code ("${code}") and was ${target ? 'left at its usual code' : 'skipped'}`);
      continue;
    }
    const textCode = str(item.text).trim();
    if (textCode && !HEX.test(textCode)) warnOnce(`the text colour of "${label}" ("${textCode}") is not a colour code; a readable one is used`);
    const text = HEX.test(textCode) ? textCode : autoText(code);
    if (contrast(code, text) < 3) warnOnce(`text on the colour "${label}" is hard to read (${contrast(code, text).toFixed(1)}:1)`);
    if (target) Object.assign(target, { name: name || target.name, code, text });
    else if (str(item._key)) out.push({ id: customId(str(item._key)), name: label, code, text, builtin: false });
  }
  return out;
}

/** The fonts chosen in Site settings → Fonts, as CSS variables (empty when none is chosen). */
export function getFontCss(byId = S().byId): string {
  const site = asObj(byId.get('siteSettings'));
  const vars: string[] = [];
  for (const role of FONT_ROLES) {
    const id = str(site[role.field]).trim();
    if (!id || id === role.default) continue;
    const stack = fontStack(id);
    if (stack) vars.push(`${role.variable}:${stack}`);
    else warnOnce(`the font "${id}" chosen for ${role.label.toLowerCase()} is not one of ${FONTS.map((f) => f.id).join(', ')}; the usual font is used`);
  }
  return vars.length ? `html:root{${vars.join(';')}}` : '';
}

/** A colour id the palette knows, else undefined. */
export function knownColour(id: unknown, byId = S().byId) {
  const v = str(id);
  return v && getPalette(byId).some((c) => c.id === v) ? v : undefined;
}

/* ---------- Pages ---------- */

export type Section = 'community' | 'festival';
/** Addresses the site itself uses; a page with one of these is skipped. */
export const RESERVED: Record<Section, string[]> = { festival: [], community: ['festival'] };

const makePages = (byId: Map<string, Obj>) => {
  const seen = new Set<string>();
  const out = [];
  const sorted = ofType('page', byId)
    .map((d) => ({ d, order: num.parse(d.order) ?? 100 }))
    .sort((a, b) => a.order - b.order || String(a.d._id).localeCompare(String(b.d._id)));
  for (const { d, order } of sorted) {
    const slug = str(asObj(d.slug).current).toLowerCase();
    const section: Section = str(d.section) === 'community' ? 'community' : 'festival';
    const name = trFirst(d, ['title'], 'en') || slug || String(d._id);
    // A menu button to the festival, not a page of its own (see makeMenuLinks).
    if (section === 'community' && str(d.goesTo) === 'festival') continue;
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
      tone: knownColour(tone, byId) ?? (tone && warnOnce(`page "${name}" uses a colour that is not in the palette (${tone}); Festival red is used`), 'red'),
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

export function getPages(section: Section = 'festival') {
  return S().pages.filter((p) => p.section === section);
}

/** Where a button or banner leads: the chosen page in the visitor's language, else its address. */
export function blockLink(block: Obj, lang: Lang) {
  const ref = str(asObj(block.page)._ref);
  if (ref) {
    const target = S().pages.find((p) => p.id === ref);
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
  // The hosted preview has no project files to look in (Cloudflare): show the address as it is.
  if (isPreview()) return /^https?:\/\//i.test(src) ? { src } : { src: withBase(local) };
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
function notePhotos(doc: Obj, photoTargets: WeakMap<object, string>) {
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
export const editAttr = (image: unknown) => (image && typeof image === 'object' ? S().photoTargets.get(image) : undefined);

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
    const background = knownColour(bg) ?? (bg && bg !== 'default' && warnOnce(`a block uses a colour that is not in the palette (${bg}); the page colour is used`), tone);
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

function makeState(docs: unknown[]): State {
  const st = emptyState();
  for (const d of docs) if (d && typeof d === 'object' && typeof (d as Obj)._id === 'string') st.byId.set((d as Obj)._id as string, d as Obj);
  if (isPreview()) for (const d of st.byId.values()) notePhotos(d, st.photoTargets);
  st.people = makePeople(st.byId);
  st.pages = makePages(st.byId);
  st.menuLinks = makeMenuLinks(st.byId);
  return st;
}

/** Makes these documents the content every helper above reads. A build calls it once (below). */
export function useDocuments(docs: unknown[]) {
  shared = makeState(docs);
}

/**
 * Runs `render` with these documents as the content, for this request only: the click-to-edit
 * preview (src/middleware.ts) calls it on every request with the documents it just loaded.
 * Pages never notice the difference.
 */
export function withDocuments<T>(docs: unknown[], render: () => Promise<T>): Promise<T> {
  return perRequest.run(makeState(docs), render);
}

useDocuments(loaded.docs);
