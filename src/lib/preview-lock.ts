// The preview lock (click-to-edit preview only, PREVIEW=1). The preview shows unpublished
// drafts, so only someone who opens it from the signed-in Studio may see them:
//
// 1. The Studio's "Edit on the page" first loads /preview/enable/?sanity-preview-secret=...,
//    a one-hour secret the Studio has just stored in the dataset for the signed-in user.
// 2. enablePreview() checks that secret with Sanity (@sanity/preview-url-secret, using the
//    Viewer token) and, if it is real, sets a signed cookie and sends the browser on to the page.
// 3. previewUnlocked() checks that cookie on every page. Without it the preview shows only
//    published content, exactly what visitors see anyway.
//
// The cookie is signed with a key derived from SANITY_VIEWER_TOKEN, which exists only in the
// host's secret settings (or the local .env), so it cannot be forged. It is SameSite=None;
// Secure; Partitioned because the Studio shows the preview in a frame from another site
// (Safari drops such cookies without Partitioned).

import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { SANITY, sanityApiHost } from './source.ts';

const COOKIE = 'fb-preview';
/** How long one opening of the Studio keeps drafts visible. */
const HOURS = 12;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const viewerToken = () => process.env.SANITY_VIEWER_TOKEN?.trim() || '';

async function sign(value: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(`preview-lock:${viewerToken()}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
}

function readCookie(request: Request, name: string) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

/** True when this request carries a valid, unexpired preview cookie. */
export async function previewUnlocked(request: Request) {
  if (!viewerToken()) return false;
  const [exp, sig] = readCookie(request, COOKIE).split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const expected = await sign(exp);
  // Same length and every character equal, without stopping early.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

/** /preview/enable/: called by the Studio with a fresh secret; unlocks drafts for this browser. */
export async function enablePreview(request: Request) {
  const token = viewerToken();
  if (!token) return text('Preview: SANITY_VIEWER_TOKEN is not set, so drafts cannot be shown.\n', 500);
  const { createClient } = await import('@sanity/client');
  const client = createClient({ projectId: SANITY.projectId, dataset: SANITY.dataset, apiVersion: SANITY.apiVersion, token, useCdn: false, ...sanityApiHost() });
  let result;
  try {
    result = await validatePreviewUrl(client, request.url);
  } catch (e) {
    return text(`Preview: could not check the Studio's secret with Sanity.\n\n${(e as Error).message}\n`, 502);
  }
  if (!result.isValid) return text('Preview: open this page from the Studio ("Edit on the page") to see drafts.\n', 401);

  const exp = String(Math.floor(Date.now() / 1000) + HOURS * 3600);
  const secure = new URL(request.url).protocol === 'https:';
  // Locally (http://localhost) the Studio and the preview are the same site, so a plain cookie works.
  const flags = secure ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax';
  // Only a path on this site, never another address.
  const to = result.redirectTo && result.redirectTo.startsWith('/') && !result.redirectTo.startsWith('//') ? result.redirectTo : '/';
  return new Response(null, {
    status: 307,
    headers: {
      location: to,
      'set-cookie': `${COOKIE}=${exp}.${await sign(exp)}; Path=/; HttpOnly; Max-Age=${HOURS * 3600}; ${flags}`,
      'cache-control': 'no-store',
    },
  });
}
