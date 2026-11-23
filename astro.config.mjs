import fs from 'node:fs';
import { defineConfig } from 'astro/config';

// Address settings come from the environment so the same code works everywhere:
//   SITE_URL  e.g. https://name.github.io   (default: https://example.com)
//   SITE_BASE e.g. /repo-name               (default: /, used for custom domains)
// Cloudflare's build of the test site sets SITE_URL (docs/HOSTING.md); SITE_BASE is only for sub-paths.
const site = process.env.SITE_URL || 'https://example.com';
const rawBase = (process.env.SITE_BASE || '/').trim();
const base = rawBase === '/' || rawBase === '' ? '/' : '/' + rawBase.replace(/^\/+|\/+$/g, '');

// Click-to-edit preview (npm run preview:edit): every page is rendered on each request from
// Sanity's drafts, for the Studio's Presentation view. Only then is the git-ignored .env file
// read (it holds SANITY_VIEWER_TOKEN). Public builds never set PREVIEW and stay static.
const preview = process.env.PREVIEW === '1';
// The same preview, built to run on Cloudflare (npm run preview:build, wrangler.jsonc): every
// `astro` command except `dev`. Its settings and the Viewer token come from Cloudflare's
// settings at run time, never from a file. `npm run preview:edit` (dev) stays on this computer.
const hosted = preview && !process.argv.includes('dev');
if (preview && !hosted && fs.existsSync('.env')) process.loadEnvFile('.env');
// Loaded only for the hosted preview; public builds never touch the Cloudflare adapter.
const cloudflare = hosted ? (await import('@astrojs/cloudflare')).default : null;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  ...(preview
    ? {
        output: 'server',
        devToolbar: { enabled: false },
        // Its own port, so it can run beside `npm run dev` (4321); fail rather than move to
        // another port the Studio does not know about.
        server: { port: 4322 },
        vite: {
          server: { strictPort: true },
          // The code on Cloudflare cannot see PREVIEW, so it is written into it.
          ...(hosted ? { define: { 'process.env.PREVIEW': JSON.stringify('1') } } : {}),
        },
        // The click-to-edit script (src/lib/preview-client.ts) on every page, preview only,
        // and the preview lock's entrance, /preview/enable/ (src/lib/preview-lock.ts).
        integrations: [
          {
            name: 'click-to-edit',
            hooks: {
              'astro:config:setup': ({ injectScript, injectRoute }) => {
                injectScript('page', "import '/src/lib/preview-client.ts';");
                injectRoute({ pattern: '/preview/enable', entrypoint: './src/preview/enable.ts', prerender: false });
              },
            },
          },
        ],
        ...(hosted
          ? {
              // Photos come from Sanity's image service, so Cloudflare's is not used; no sessions.
              adapter: cloudflare({ imageService: 'passthrough' }),
              session: false,
            }
          : {}),
      }
    : {}),
});
