// Everything the pages need from the content files, in one place.
// Pages never read raw files; they call these helpers, which tolerate missing
// fields and skip broken entries (with a warning) instead of failing the build.

import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import { marked } from 'marked';
import { text, flag, textList } from './schema';
import { isLang, type Lang } from './i18n';
import siteRaw from '../content/settings/site.json';
import communityRaw from '../content/settings/community.json';
import festivalRaw from '../content/settings/festival.json';

/* ---------- Settings ---------- */

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

const CommunitySchema = z.object({
  title_en: text,
  title_hu: text,
  heroImage: text,
  intro_en: text,
  intro_hu: text,
});

const FestivalSchema = z.object({
  name: text,
  logo: text,
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

export function getSite() {
  const s = SiteSchema.parse(siteRaw);
  const defaultLang: Lang = isLang(s.defaultLang) ? s.defaultLang : 'en';
  return { ...s, name: s.name || 'Community', defaultLang };
}

export function getCommunity() {
  return CommunitySchema.parse(communityRaw);
}

export function getFestival() {
  const f = FestivalSchema.parse(festivalRaw);
  return { ...f, name: f.name || 'Festival' };
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

/**
 * Text written by editors may contain links like [Program](/en/festival/program/) and photos at
 * /uploads/x.jpg. This puts the base path in front of those in the finished HTML.
 */
export function rebaseHtml(html: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  if (!base) return html;
  return html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${base}/`);
}

/** Only allow normal links. Anything else (e.g. "javascript:") is dropped. Site-relative links get the base path. */
export function safeUrl(u: string) {
  const v = (u ?? '').trim();
  if (!/^(https?:\/\/|mailto:|\/(?!\/))/i.test(v)) return '';
  return v.startsWith('/') ? withBase(v) : v;
}

/* ---------- Text ---------- */

/** Plain multi-line text: each blank-line-separated block is a paragraph. */
export function paragraphs(s: string) {
  return (s ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** A text page body (Markdown or HTML, whichever the editor saved) as finished HTML. */
export function renderBody(body: string) {
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
  return rebaseHtml(html);
}

/* ---------- Collections ---------- */

const GROUPS = { teacher: 'teacher', artist: 'artist' } as const;
export type Group = keyof typeof GROUPS;
const warned = new Set<string>();
const warnOnce = (msg: string) => {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[content-warning] ${msg}`);
};

export async function getPeople(group?: Group) {
  const entries = await getCollection('people');
  const all = entries
    .map((e) => {
      const g = e.data.group.toLowerCase();
      if (!(g in GROUPS)) {
        warnOnce(`person "${e.id}" has no group (Teacher or Artist) and is shown with the teachers`);
      }
      return {
        id: e.id,
        ...e.data,
        name: e.data.name || e.id,
        group: (g in GROUPS ? g : 'teacher') as Group,
        order: e.data.order ?? 100,
      };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return group ? all.filter((p) => p.group === group) : all;
}
export type Person = Awaited<ReturnType<typeof getPeople>>[number];

/** Addresses under /festival/ that belong to built-in pages; a text page with one of these names is skipped. */
export const RESERVED_SLUGS = new Set(['program', 'teachers', 'artists']);

export async function getPages() {
  const entries = (await getCollection('pages')).filter((e) => {
    if (!RESERVED_SLUGS.has(e.id)) return true;
    warnOnce(`text page "${e.id}" uses a reserved address and was skipped`);
    return false;
  });
  return entries
    .map((e) => ({
      slug: e.id,
      ...e.data,
      title_en: e.data.title_en || e.data.title_hu || e.id,
      title_hu: e.data.title_hu || e.data.title_en || e.id,
      order: e.data.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order || a.title_en.localeCompare(b.title_en));
}
export type TextPage = Awaited<ReturnType<typeof getPages>>[number];

/* ---------- Images ---------- */

type Manifest = Record<
  string,
  { width: number; height: number; variants: { w: number; url: string }[] }
>;
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

export type ResolvedImage = { src: string; srcset?: string; width?: number; height?: number };

/** Returns web-sized variants when we made them; otherwise the original path; nothing if the file is gone. */
export function getImage(src?: string): ResolvedImage | undefined {
  if (!src) return undefined;
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
