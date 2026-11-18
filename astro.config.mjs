import fs from 'node:fs';
import { defineConfig } from 'astro/config';

// Address settings come from the environment so the same code works everywhere:
//   SITE_URL  e.g. https://name.github.io   (default: https://example.com)
//   SITE_BASE e.g. /repo-name               (default: /, used for custom domains)
// The GitHub workflow (.github/workflows/deploy.yml) sets both automatically.
const site = process.env.SITE_URL || 'https://example.com';
const rawBase = (process.env.SITE_BASE || '/').trim();
const base = rawBase === '/' || rawBase === '' ? '/' : '/' + rawBase.replace(/^\/+|\/+$/g, '');

// Click-to-edit preview (npm run preview:edit): every page is rendered on each request from
// Sanity's drafts, for the Studio's Presentation view. Only then is the git-ignored .env file
// read (it holds SANITY_VIEWER_TOKEN). Public builds never set PREVIEW and stay static.
const preview = process.env.PREVIEW === '1';
if (preview && fs.existsSync('.env')) process.loadEnvFile('.env');

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
        vite: { server: { strictPort: true } },
        // The click-to-edit script (src/lib/preview-client.ts) on every page, preview only.
        integrations: [
          {
            name: 'click-to-edit',
            hooks: { 'astro:config:setup': ({ injectScript }) => injectScript('page', "import '/src/lib/preview-client.ts';") },
          },
        ],
      }
    : {}),
});
