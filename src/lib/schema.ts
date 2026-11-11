// Small forgiving field types shared by the content config and the settings files.
// Whatever an editor (or a tool) saves, these never throw: wrong types are converted
// where that makes sense, and anything unusable becomes '' / the fallback / undefined.
// Only malformed file syntax (for example broken JSON) can still fail a build.

import { z } from 'astro/zod';

/** Any scalar becomes a trimmed string; null, missing and objects become ''. */
export const text = z.preprocess(
  (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v)),
  z.string().transform((s) => s.trim()),
);

/** true/false, also accepts "true", "yes", "1" and "false", "no", "0", ''; anything else uses the fallback. */
export const flag = (fallback: boolean) =>
  z.preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (['true', 'yes', '1'].includes(s)) return true;
      if (['false', 'no', '0'].includes(s)) return false;
    }
    return fallback;
  }, z.boolean());

/** A number, or undefined when the value is empty or not a number. */
export const num = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

/** A list of strings; a single string becomes a one-item list; anything else becomes []. */
export const textList = z.preprocess((v) => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim() !== '');
  if (typeof v === 'string' && v.trim() !== '') return [v];
  return [];
}, z.array(z.string()));
