// Runs before every page. In a public build it does nothing. In the click-to-edit preview
// (PREVIEW=1) it loads the latest drafts from Sanity first, so each page shows unpublished
// changes with the markers that let a click open the right field in the Studio.
import { defineMiddleware } from 'astro:middleware';
import { isPreview, loadPreviewDocuments } from './lib/source';
import { useDocuments } from './lib/content';

export const onRequest = defineMiddleware(async (context, next) => {
  if (!isPreview()) return next();
  // Photos, scripts and styles need no content.
  if (/\.[a-z0-9]+$/i.test(context.url.pathname) && !context.url.pathname.endsWith('.html')) return next();
  try {
    useDocuments(await loadPreviewDocuments());
  } catch (e) {
    return new Response(`Preview: could not load drafts from Sanity.\n\n${(e as Error).message}\n`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  const response = await next();
  // A preview page always shows the newest draft: never cache it, never index it.
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-robots-tag', 'noindex');
  return response;
});
