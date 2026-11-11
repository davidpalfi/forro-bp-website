import { defineConfig } from 'astro/config';

// Address settings come from the environment so the same code works everywhere:
//   SITE_URL  e.g. https://name.github.io   (default: https://example.com)
//   SITE_BASE e.g. /repo-name               (default: /, used for custom domains)
// The GitHub workflow (.github/workflows/deploy.yml) sets both automatically.
const site = process.env.SITE_URL || 'https://example.com';
const rawBase = (process.env.SITE_BASE || '/').trim();
const base = rawBase === '/' || rawBase === '' ? '/' : '/' + rawBase.replace(/^\/+|\/+$/g, '');

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
});
