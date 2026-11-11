// Everything the pages need from the content files, in one place.
// Pages never read raw files; they call these helpers, which tolerate missing
// fields and skip broken entries (with a warning) instead of failing the build.

import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import { text, flag } from './schema';
import siteRaw from '../content/settings/site.json';
import homeRaw from '../content/settings/home.json';

/* ---------- Settings ---------- */

const LabelsSchema = z
  .object({
    home: text,
    program: text,
    people: text,
    details: text,
    noEvents: text,
    teachers: text,
    performers: text,
    organizers: text,
    others: text,
  })
  .partial()
  .nullish();

const SiteSchema = z.object({
  name: text,
  tagline: text,
  locale: text,
  email: text,
  instagram: text,
  facebook: text,
  ticketLabel: text,
  ticketUrl: text,
  footerNote: text,
  noindex: flag(true),
  labels: LabelsSchema,
});

const HomeSchema = z.object({
  heroTitle: text,
  heroSubtitle: text,
  dateLine: text,
  heroImage: text,
  ctaLabel: text,
  ctaUrl: text,
  intro: text,
  eventsHeading: text,
  peopleHeading: text,
  linksHeading: text,
});

const DEFAULT_LABELS = {
  home: 'Home',
  program: 'Program',
  people: 'People',
  details: 'Details',
  noEvents: 'The program will be announced soon.',
  teachers: 'Teachers',
  performers: 'Performers',
  organizers: 'Organizers',
  others: 'More people',
};

export function getSite() {
  const s = SiteSchema.parse(siteRaw);
  const given = Object.fromEntries(
    Object.entries(s.labels ?? {}).filter(([, v]) => typeof v === 'string' && v !== ''),
  );
  return {
    ...s,
    name: s.name || 'Festival',
    locale: s.locale || 'en-GB',
    labels: { ...DEFAULT_LABELS, ...given },
  };
}

export function getHome() {
  const h = HomeSchema.parse(homeRaw);
  return {
    ...h,
    eventsHeading: h.eventsHeading || 'Coming up',
    peopleHeading: h.peopleHeading || 'Meet the people',
    linksHeading: h.linksHeading || 'Watch and look',
  };
}

/* ---------- Links ---------- */

/**
 * Puts the site's base path in front of a site-relative address ("/program/").
 * The base is "/" on a custom domain and "/repo-name" on github.io/repo-name.
 * Never write a root-relative address by hand; always go through this.
 */
export function withBase(p: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return base + '/' + (p ?? '').replace(/^\/+/, '');
}

/**
 * Text pages: editors write Markdown links like [Program](/program/) and photos at /uploads/x.jpg.
 * This puts the base path in front of those in the finished HTML. No-op when the base is "/".
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

export function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

/* ---------- Dates ---------- */

/** "2026-06-19" -> a Date at noon UTC (so time zones can never shift the day). */
export function parseDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(y, mo - 1, day, 12));
  // Reject impossible dates like 2027-13-45, which JavaScript would silently roll over.
  if (Number.isNaN(d.getTime()) || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== day) return null;
  return d;
}

export function formatDay(date: Date, locale: string, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date);
  }
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

/* ---------- Collections ---------- */

const baseId = (ref: string) => ref.split('/').pop()!.replace(/\.[^.]+$/, '');

export async function getPeople() {
  const entries = await getCollection('people');
  return entries
    .map((e) => ({
      id: e.id,
      ...e.data,
      name: e.data.name || e.id,
      order: e.data.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
export type Person = Awaited<ReturnType<typeof getPeople>>[number];

export async function getEvents() {
  const entries = await getCollection('events');
  const out = [];
  for (const e of entries) {
    const dateObj = parseDay(e.data.date);
    if (!dateObj) {
      console.warn(`[content-warning] event "${e.id}" has no valid date (needs yyyy-mm-dd) and was skipped`);
      continue;
    }
    out.push({
      id: e.id,
      ...e.data,
      title: e.data.title || e.id,
      day: e.data.date.slice(0, 10),
      dateObj,
    });
  }
  return out.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title),
  );
}
export type FestivalEvent = Awaited<ReturnType<typeof getEvents>>[number];

/** Turn stored references (file paths or ids) into people. Missing people are ignored. */
export function resolvePeople(refs: string[], people: Person[]) {
  const byId = new Map(people.map((p) => [p.id, p]));
  return refs.map((r) => byId.get(baseId(r))).filter((p): p is Person => Boolean(p));
}

export async function getLinks() {
  const entries = await getCollection('links');
  return entries
    .map((e) => ({
      id: e.id,
      ...e.data,
      url: safeUrl(e.data.url), // unsafe or empty links become '' and are dropped below
      label: e.data.label || e.data.url,
      order: e.data.order ?? 100,
    }))
    .filter((l) => l.url)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

/** Addresses that belong to built-in pages; a text page with one of these names is skipped. */
const RESERVED_SLUGS = new Set(['program', 'people', '404', 'uploads']);
const warnedSlugs = new Set<string>();

export async function getPages() {
  const entries = (await getCollection('pages')).filter((e) => {
    if (!RESERVED_SLUGS.has(e.id)) return true;
    if (!warnedSlugs.has(e.id)) {
      warnedSlugs.add(e.id);
      console.warn(`[content-warning] text page "${e.id}" uses a reserved address and was skipped`);
    }
    return false;
  });
  return entries
    .map((e) => ({
      entry: e,
      slug: e.id,
      title: e.data.title || e.id,
      menuLabel: e.data.menuLabel || e.data.title || e.id,
      showInMenu: e.data.showInMenu,
      order: e.data.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

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

/** Returns web-sized variants when we made them; otherwise the original path. */
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
      console.warn(`[content-warning] photo "${src}" was not found in public/uploads and was left out`);
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
