// Click-to-edit in the Studio's Presentation view. Added to every page only in the preview
// (PREVIEW=1, by the "click-to-edit" integration in astro.config.mjs); public builds never
// include or even bundle it. Bundled from @sanity/visual-editing and served by the preview
// itself, it talks only to the Studio window showing the page: it outlines texts and photos,
// and a click opens that field in the Studio.
import { enableVisualEditing } from '@sanity/visual-editing';

enableVisualEditing({
  // After an edit in the Studio, load the page again: the preview server reads the new draft.
  refresh: (payload) => {
    if (payload.source === 'manual' || payload.source === 'mutation') {
      return new Promise<void>(() => window.location.reload());
    }
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
