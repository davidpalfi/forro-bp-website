// Runs before every page. In a public build it does nothing. In the click-to-edit preview
// (PREVIEW=1, locally or on Cloudflare) it loads the documents from Sanity first: the latest
// drafts for a browser the preview lock has let in (src/lib/preview-lock.ts), otherwise only
// published content. Texts carry the markers that let a click open the right field.
import { defineMiddleware } from 'astro:middleware';
import { isPreview, loadPreviewDocuments } from './lib/source';
import { withDocuments } from './lib/content';
import { previewUnlocked } from './lib/preview-lock';
import { isLang } from './lib/i18n';

/** A short note on pages shown without drafts, so nobody wonders where their edit went. */
const LOCKED_NOTE =
  '<div role="status" style="position:fixed;inset:auto 0 0 0;z-index:9999;padding:.5rem 1rem;background:#222;color:#fff;font:14px/1.4 system-ui,sans-serif;text-align:center">' +
  'Preview: unpublished changes are hidden. Open this page from the Studio, "Edit on the page", to see them.</div>';

export const onRequest = defineMiddleware(async (context, next) => {
  if (!isPreview()) return next();
  // Photos, scripts, styles and the lock's own address need no content.
  const p = context.url.pathname;
  if ((/\.[a-z0-9]+$/i.test(p) && !p.endsWith('.html')) || p.startsWith('/preview/')) return next();
  const unlocked = await previewUnlocked(context.request);
  let docs;
  try {
    docs = await loadPreviewDocuments(unlocked ? 'drafts' : 'published');
  } catch (e) {
    return new Response(`Preview: could not load the content from Sanity.\n\n${(e as Error).message}\n`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  // The whole page is rendered (not streamed) inside withDocuments, so it only ever sees
  // this request's documents.
  return withDocuments(docs, async () => {
    // A public build only has /en/... and /hu/...; on request any first word would match, so
    // anything else gets the "not found" page, as on the public site.
    const first = p.split('/')[1] || '';
    const unknown = first !== '' && !isLang(first) && !/^404(\.html)?$/.test(first);
    const response = unknown ? await context.rewrite('/404/') : await next();
    const headers = new Headers(response.headers);
    // A preview page always shows the newest content: never cache it, never index it.
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex');
    headers.delete('content-length');
    if (!(headers.get('content-type') || '').includes('text/html')) return new Response(response.body, { status: response.status, headers });
    let html = await response.text();
    if (!unlocked) html = html.replace('</body>', `${LOCKED_NOTE}</body>`);
    return new Response(html, { status: unknown ? 404 : response.status, headers });
  });
});
