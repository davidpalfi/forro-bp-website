// Runs before `npm run studio:deploy`: the deployed Studio's "Edit on the page" must point at
// the preview on Cloudflare, never at localhost (which cannot load for anyone else).
// The address comes from SANITY_STUDIO_PREVIEW_URL, or from studio/.env.production.
import fs from 'node:fs';

let url = process.env.SANITY_STUDIO_PREVIEW_URL || '';
const file = 'studio/.env.production';
if (!url && fs.existsSync(file)) {
  const m = /^SANITY_STUDIO_PREVIEW_URL=(.*)$/m.exec(fs.readFileSync(file, 'utf8'));
  url = (m?.[1] || '').trim();
}
if (!/^https:\/\/[^/]+/.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
  console.error(
    'Not deploying: the Studio needs the online preview\'s address first.\n' +
      `Put SANITY_STUDIO_PREVIEW_URL=https://<the preview's address> in ${file} (see docs/HOSTING.md).`,
  );
  process.exit(1);
}
console.log(`"Edit on the page" will open ${url}`);
