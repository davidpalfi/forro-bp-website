// Part of npm run check (section [8]); can also be run alone: node scripts/check-preview.mjs
//
// Builds the click-to-edit preview for Cloudflare (npm run preview:build) in a temporary copy,
// runs it in Cloudflare's own runtime on this computer (wrangler dev), pointed at a stand-in
// for Sanity (scripts/lib/fake-sanity.mjs), and checks the preview lock, drafts, addresses,
// parallel requests and, if Playwright is installed, the update without reload in a browser.
// Nothing contacts Sanity or Cloudflare.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { makeFixture } from './lib/sanity-fixture.mjs';
import { startFakeSanity, TOKEN, SECRET, DRAFT_NAME } from './lib/fake-sanity.mjs';

const ROOT = process.cwd();
const SANITY_PORT = 4399;
const PORT = 4398;
const BASE = `http://localhost:${PORT}`;
let failures = 0;
const check = (condition, message) => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) failures++;
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-preview-'));
const skip = new Set(['node_modules', 'dist', '.astro', '_img', '.git', '.wrangler', '.env']);
fs.cpSync(ROOT, dir, { recursive: true, filter: (src) => !skip.has(path.basename(src)) });
fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'junction');

let fake;
let worker;
try {
  const b = spawnSync('npm', ['run', 'preview:build'], { cwd: dir, encoding: 'utf8', timeout: 240000, env: { ...process.env, SITE_URL: '', SITE_BASE: '' } });
  check(b.status === 0, 'the preview builds for Cloudflare (npm run preview:build)');
  if (b.status !== 0) throw new Error(`${b.stdout}${b.stderr}`.slice(-3000));
  const server = fs.readFileSync(path.join(dir, 'dist/server/entry.mjs'), 'utf8');
  check(!/src\/content\/settings/.test(server), 'the preview code does not read the JSON content files');

  const docs = makeFixture(path.join(ROOT, 'src/content')).filter((d) => !String(d._id).startsWith('drafts.'));
  fake = await startFakeSanity(docs, SANITY_PORT);

  worker = spawn(
    'npx',
    ['wrangler', 'dev', '--port', String(PORT), '--var', `SANITY_VIEWER_TOKEN:${TOKEN}`, '--var', `SANITY_API_HOST:http://127.0.0.1:${SANITY_PORT}`],
    { cwd: dir, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let log = '';
  worker.stdout.on('data', (d) => (log += d));
  worker.stderr.on('data', (d) => (log += d));
  const started = Date.now();
  while (!/Ready on/.test(log) && Date.now() - started < 60000 && worker.exitCode === null) await new Promise((r) => setTimeout(r, 300));
  check(/Ready on/.test(log), 'the preview starts in Cloudflare\'s runtime (wrangler dev)');
  if (!/Ready on/.test(log)) throw new Error(log.slice(-3000));

  const get = (p, cookie) => fetch(BASE + p, { redirect: 'manual', headers: cookie ? { cookie } : {} });
  const page = async (p, cookie) => {
    const r = await get(p, cookie);
    return { status: r.status, headers: r.headers, html: await r.text() };
  };

  // Locked: what anyone gets without opening the preview from the Studio.
  const locked = await page('/en/festival/');
  check(locked.status === 200 && !locked.html.includes(DRAFT_NAME), 'without the lock the preview shows published content only');
  check(locked.html.includes('unpublished changes are hidden'), 'without the lock the page says how to see drafts');
  check(locked.headers.get('cache-control') === 'no-store' && locked.headers.get('x-robots-tag') === 'noindex', 'preview pages are never cached and never indexed');
  check(!fake.requests.some((r) => r.authorized && r.perspective === 'drafts'), 'without the lock no drafts are even requested from Sanity');

  // The lock's entrance.
  const wrong = await get(`/preview/enable/?sanity-preview-secret=wrong&sanity-preview-pathname=/hu/festival/`);
  check(wrong.status === 401 && !wrong.headers.get('set-cookie'), 'a wrong Studio secret is refused and sets no cookie');
  const none = await get(`/preview/enable/`);
  check(none.status === 401, 'no Studio secret is refused');
  const right = await get(`/preview/enable/?sanity-preview-secret=${SECRET}&sanity-preview-pathname=/hu/festival/`);
  const cookieHeader = right.headers.get('set-cookie') || '';
  check(right.status === 307 && right.headers.get('location') === '/hu/festival/', 'the Studio\'s secret is accepted and leads to the page asked for');
  check(/HttpOnly/.test(cookieHeader) && /Max-Age=\d+/.test(cookieHeader), 'the preview cookie is HttpOnly and expires');
  const away = await get(`/preview/enable/?sanity-preview-secret=${SECRET}&sanity-preview-pathname=//example.com/x`);
  check(away.status === 307 && !/example\.com/.test(away.headers.get('location') || ''), 'the entrance never sends the browser to another site');
  const cookie = cookieHeader.split(';')[0];

  const unlocked = await page('/en/festival/', cookie);
  check(unlocked.html.includes(DRAFT_NAME) && !unlocked.html.includes('unpublished changes are hidden'), 'with the lock open the preview shows drafts');
  const forged = await page('/en/festival/', 'fb-preview=9999999999.forged');
  check(!forged.html.includes(DRAFT_NAME), 'a made-up cookie shows no drafts');
  const expired = await page('/en/festival/', `fb-preview=1.${cookie.split('.')[1]}`);
  check(!expired.html.includes(DRAFT_NAME), 'an expired cookie shows no drafts');

  // Two kinds of request at the same time never see each other's content.
  const mixed = await Promise.all(Array.from({ length: 16 }, (_, i) => page('/en/festival/', i % 2 ? cookie : undefined)));
  check(mixed.every((r, i) => r.html.includes(DRAFT_NAME) === Boolean(i % 2)), 'requests with and without the lock at the same time each get their own content');

  // Every kind of address.
  const pages = ['/', '/en/', '/hu/', '/en/festival/', '/hu/festival/program/', '/en/festival/teachers/', '/hu/festival/artists/', '/en/festival/location/', '/en/festival/everything/'];
  const statuses = await Promise.all(pages.map(async (p) => [p, (await page(p, cookie)).status]));
  const bad = statuses.filter(([, s]) => s !== 200);
  check(bad.length === 0, `every page renders in the preview${bad.length ? ': ' + bad.map(([p, s]) => `${p} ${s}`).join(', ') : ''}`);
  const missing = await Promise.all(['/xx/festival/', '/en/nope/', '/en/festival/nope/'].map(async (p) => (await page(p, cookie)).status));
  check(missing.every((s) => s === 404), 'unknown addresses get the "not found" page');
  const css = (unlocked.html.match(/href="(\/_astro\/[^"]+\.css)"/) || [])[1];
  check(Boolean(css) && (await get(css)).status === 200, 'styles and scripts are served by the preview');
  const editScript = (unlocked.html.match(/src="(\/_astro\/[^"]+\.js)"/) || [])[1];
  check(Boolean(editScript), 'the click-to-edit script is on preview pages');

  // In a browser: an edit shows up without reloading the page.
  let playwright;
  try {
    playwright = createRequire(path.join(ROOT, 'package.json'))('playwright');
  } catch {
    try {
      playwright = createRequire(import.meta.url)('playwright');
    } catch {
      playwright = null;
    }
  }
  if (!playwright) {
    console.log('SKIP  the update without reload (Playwright is not installed here)');
  } else {
    const browser = await playwright.chromium.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      const [name, value] = cookie.split('=');
      await context.addCookies([{ name, value, url: BASE }]);
      const tab = await context.newPage();
      const errors = [];
      tab.on('pageerror', (e) => errors.push(e.message));
      await tab.goto(`${BASE}/en/festival/`);
      await tab.waitForFunction(() => typeof window.__previewRefresh === 'function');
      await tab.evaluate(() => {
        window.__notReloaded = true;
        window.scrollTo(0, 400);
      });
      fake.state.draftName = 'Edited just now';
      await tab.evaluate(() => window.__previewRefresh());
      const after = await tab.evaluate(() => ({
        kept: window.__notReloaded === true,
        scroll: window.scrollY,
        shown: document.body.textContent.includes('Edited just now') && document.title.includes('Edited just now'),
        overlay: document.querySelectorAll('sanity-visual-editing').length,
      }));
      check(after.shown, 'after an edit the page shows the new draft');
      check(after.kept && after.scroll >= 390, 'the page is updated without reloading and keeps its scroll position');
      check(after.overlay <= 1, 'the editing overlay is not duplicated by the update');
      await tab.evaluate(() => window.scrollTo(0, 0));
      await tab.click('.menu-btn');
      const open = await tab.evaluate(() => document.documentElement.classList.contains('menu-open'));
      check(open, 'the menu button still works after an update');
      // Sanity's overlays stop a click on a link text inside the Studio; a stand-in for them
      // (a capture handler on the link that cancels the click) must not stop going to the page.
      const link = '#menu a[href="/en/festival/program/"]';
      await tab.evaluate((sel) => document.querySelector(sel)?.addEventListener('click', (e) => e.preventDefault(), { capture: true }), link);
      await Promise.all([tab.waitForURL('**/en/festival/program/', { timeout: 10000 }).catch(() => {}), tab.click(link)]);
      check(new URL(tab.url()).pathname === '/en/festival/program/', 'a click on a menu link goes to that page even where click-to-edit would catch it');
      check(errors.length === 0, `no script errors in the preview${errors.length ? ': ' + errors.join('; ') : ''}`);
    } finally {
      await browser.close();
    }
  }
} catch (e) {
  check(false, `preview test stopped: ${e.message}`);
} finally {
  if (worker && worker.exitCode === null) worker.kill('SIGTERM');
  if (fake) await fake.close();
  try {
    fs.unlinkSync(path.join(dir, 'node_modules'));
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* temporary folder */
  }
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(failures ? 1 : 0);
export default failures;
