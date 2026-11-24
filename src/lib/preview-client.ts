// Click-to-edit in the Studio's Presentation view. Added to every page only in the preview
// (PREVIEW=1, by the "click-to-edit" integration in astro.config.mjs); public builds never
// include or even bundle it. Bundled from @sanity/visual-editing and served by the preview
// itself, it talks only to the Studio window showing the page: it outlines texts and photos,
// and a click opens that field in the Studio.
import { enableVisualEditing } from '@sanity/visual-editing';

// Sanity's own overlay element lives in <body> too; it must survive a swap.
const KEEP = 'sanity-visual-editing';
let latest = 0;

/**
 * Shows the newest version of this page without reloading it: fetches the page again in the
 * background (the preview server reads the new draft) and swaps the page's content, so there
 * is no white flash and the scroll position stays. The overlays find the new elements by
 * themselves. If anything goes wrong, falls back to a normal reload.
 */
async function swapInNewVersion() {
  const mine = ++latest;
  try {
    const res = await fetch(location.href, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const next = new DOMParser().parseFromString(await res.text(), 'text/html');
    // A newer edit started meanwhile: let that one show its result.
    if (mine !== latest) return;
    document.title = next.title;
    const keep = (el: Element) => el.localName === KEEP || el.localName === 'script';
    for (const el of [...document.body.children]) if (!keep(el)) el.remove();
    const anchor = document.body.firstElementChild;
    for (const el of [...next.body.children]) if (!keep(el)) document.body.insertBefore(document.adoptNode(el), anchor);
    // Small inline scripts (the menu button) set up the new elements again; module scripts,
    // like this one, keep running and are never loaded twice.
    for (const old of [...document.body.querySelectorAll('script:not([src]):not([type="module"])')]) old.remove();
    for (const src of [...next.body.querySelectorAll('script:not([src]):not([type="module"])')]) {
      const run = document.createElement('script');
      run.textContent = src.textContent;
      document.body.appendChild(run);
    }
  } catch {
    window.location.reload();
  }
}

// For trying it by hand (and for npm run check): run __previewRefresh() in the browser console.
(window as unknown as { __previewRefresh: () => Promise<void> }).__previewRefresh = swapInNewVersion;

// A plain click on a link to another page of the site goes there, as on the real site. Without
// this, Sanity's click-to-edit catches clicks on link texts (menu items, buttons: they carry the
// editing markers), opens the text in the Studio and stays on the page. Registered on window
// in the capture phase, so it runs before the overlays' own handlers on the elements. Link texts
// are edited in the form instead. Same-page links (#...), other sites (the photo viewer's
// photos) and modified clicks are left alone.
window.addEventListener(
  'click',
  (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(url.href);
  },
  { capture: true },
);

enableVisualEditing({
  // After an edit in the Studio (or its Refresh button), show the new version of the page.
  refresh: (payload) => {
    if (payload.source === 'manual' || payload.source === 'mutation') return swapInNewVersion();
    return false;
  },
  // Keeps the address bar in the Studio in step with the page shown.
  history: {
    subscribe: (navigate) => {
      navigate({ type: 'replace', url: `${location.pathname}${location.search}` });
      const handler = () => navigate({ type: 'push', url: `${location.pathname}${location.search}` });
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    },
    update: (update) => {
      if (update.type === 'pop') return window.history.back();
      // Every page is a separate document here, so going to another page is a normal load.
      if (update.url !== `${location.pathname}${location.search}`) window.location.assign(update.url);
    },
  },
});
