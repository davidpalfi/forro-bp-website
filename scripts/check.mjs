// npm run check
//
// Builds the real content, then a deliberately broken copy, then a sub-path copy, and asserts
// the results. Takes about 20-40 seconds. Exit code 1 if anything fails. Nothing in the repo
// is changed: the broken content only exists in temporary copies.
//
// Content warnings ([content-warning] lines) are REPORTED here but never fail the check:
// a warning must not stop the site from being published (docs/DECISIONS.md, decision 8).
//
// What this cannot check (needs a browser): the menu button, the language redirect on "/",
// layout on phones, and anything about the live Pages CMS or hosting. See docs/HANDOFF.md.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const LANGS = ['en', 'hu'];
const tmpDirs = [];
let failures = 0;

const check = (condition, message) => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) failures++;
};

function copyProject(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `site-${label}-`));
  tmpDirs.push(dir);
  const skip = new Set(['node_modules', 'dist', '.astro', '_img', '.git']);
  fs.cpSync(ROOT, dir, { recursive: true, filter: (src) => !skip.has(path.basename(src)) });
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}

function build(dir, extraEnv = {}) {
  // Builds run with no address settings unless given, so a stray SITE_URL/SITE_BASE in your shell cannot change them.
  const env = { ...process.env, SITE_URL: '', SITE_BASE: '', ...extraEnv };
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: dir,
    env,
    encoding: 'utf8',
    timeout: 240000,
    shell: process.platform === 'win32',
  });
  return { code: r.status, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const dist = (dir, rel) => path.join(dir, 'dist', rel);
const read = (dir, rel) => fs.readFileSync(dist(dir, rel), 'utf8');
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const warningsIn = (output) => output.split('\n').filter((l) => l.includes('[content-warning]'));

function htmlFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  walk(path.join(dir, 'dist'));
  return out;
}

/** Every local link, image and srcset URL in the built HTML must point at a file that exists. */
function brokenReferences(dir, base = '') {
  const missing = new Set();
  const resolves = (url) => {
    let clean = url.split('#')[0].split('?')[0];
    if (!clean.startsWith('/') || clean.startsWith('//')) return true; // external or not local
    if (base) {
      if (!clean.startsWith(base + '/')) return false; // a root-relative address that ignores the base path
      clean = clean.slice(base.length);
    }
    const target = path.join(dir, 'dist', decodeURI(clean));
    return (
      (fs.existsSync(target) && fs.statSync(target).isFile()) ||
      fs.existsSync(path.join(target, 'index.html'))
    );
  };
  for (const file of htmlFiles(dir)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) if (!resolves(m[1])) missing.add(m[1]);
    for (const m of html.matchAll(/srcset="([^"]+)"/g))
      for (const part of m[1].split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url && !resolves(url)) missing.add(url);
      }
  }
  return [...missing];
}

const allHtml = (dir) => htmlFiles(dir).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const jsonFiles = (rel) =>
  fs
    .readdirSync(path.join(ROOT, rel))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(fs.readFileSync(path.join(ROOT, rel, f), 'utf8')) }));

/* ------------------------------------------------------------------ */
console.log('\n[1] Real content');
{
  const dir = copyProject('real');
  const { code, output } = build(dir);
  check(code === 0, 'build passes');
  check(fs.existsSync(dist(dir, 'index.html')) && fs.existsSync(dist(dir, '404.html')), 'root page and 404 page exist');
  const pages = jsonFiles('src/content/pages');
  for (const lang of LANGS) {
    const routes = ['', 'festival/', 'festival/program/', 'festival/teachers/', 'festival/artists/', ...pages.map((p) => `festival/${p.id}/`)];
    const missing = routes.filter((r) => !fs.existsSync(dist(dir, `${lang}/${r}index.html`)));
    check(missing.length === 0, `all pages exist in "${lang}"${missing.length ? ': missing ' + missing.join(', ') : ''}`);
  }
  if (code === 0) {
    const people = jsonFiles('src/content/people').filter((p) => p.name);
    for (const lang of LANGS) {
      const teachers = read(dir, `${lang}/festival/teachers/index.html`);
      const artists = read(dir, `${lang}/festival/artists/index.html`);
      const wrong = people.filter((p) => !(String(p.group).toLowerCase() === 'artist' ? artists : teachers).includes(esc(p.name)));
      check(wrong.length === 0, `every person is on the right page in "${lang}"${wrong.length ? ': ' + wrong.map((p) => p.id).join(', ') : ''}`);
    }
    const en = read(dir, 'en/festival/index.html');
    const hu = read(dir, 'hu/festival/index.html');
    check(/<html lang="en"/.test(en) && /<html lang="hu"/.test(hu), 'each language version declares its language');
    check(en.includes('hreflang="hu"') && hu.includes('hreflang="en"'), 'language versions point at each other (hreflang)');
    check(en.includes('/hu/festival/') && hu.includes('/en/festival/'), 'the language switch links to the same page in the other language');
    check(!/javascript:/i.test(allHtml(dir)), 'no javascript: links in the output');
    const broken = brokenReferences(dir);
    check(broken.length === 0, `no broken local links, images or srcset URLs${broken.length ? ': ' + broken.join(', ') : ''}`);
    const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/settings/site.json'), 'utf8'));
    check(
      /name="robots" content="noindex/.test(en) === (site.noindex !== false),
      'noindex meta tag matches the setting in site.json',
    );
    check(!/https?:\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.|www\.googletagmanager)/i.test(allHtml(dir)), 'no third-party fonts, scripts or trackers are loaded');
    const w = warningsIn(output);
    console.log(w.length ? `NOTE  ${w.length} content warning(s) in the real content (not a failure):\n      ${w.join('\n      ')}` : 'NOTE  no content warnings in the real content');
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[2] Deliberately broken content (the site must still build)');
{
  const dir = copyProject('broken');
  const c = (rel) => path.join(dir, 'src/content', rel);
  const put = (rel, value) => fs.writeFileSync(c(rel), typeof value === 'string' ? value : JSON.stringify(value));
  const patch = (rel, changes, remove = []) => {
    const obj = JSON.parse(fs.readFileSync(c(rel), 'utf8'));
    Object.assign(obj, changes);
    for (const k of remove) delete obj[k];
    put(rel, obj);
  };

  put('people/no-name.json', { name: null, group: null, photo: '/uploads/does-not-exist.jpg', instagram: 'javascript:alert(1)', order: 'abc' });
  put('people/only-hungarian.json', { name: 'Only Hungarian', group: 'artist', bio_hu: 'Csak magyarul.', role_hu: 12 });
  put('people/empty.json', {});
  put('pages/program.json', { title_en: 'Clash', body_en: 'Should be skipped.' });
  put('pages/untitled.json', { body_en: 'Body only. [bad](javascript:alert(1))', gallery: '/uploads/also-missing.jpg', showInMenu: 'yes' });
  patch('settings/site.json', { defaultLang: 'xx', tagline_en: null, facebook: 'not a url', email: 5 }, ['footerNote_hu']);
  patch('settings/festival.json', { heroImage: '/uploads/gone.jpg', programImages: null, intro_hu: null, ticketUrl: 'javascript:alert(1)', logo: 7 });
  patch('settings/community.json', { title_en: null, title_hu: null });
  // A photo too large to be comfortable, and a file that is not really a photo.
  fs.writeFileSync(path.join(dir, 'public/uploads/huge.jpg'), Buffer.alloc(9 * 1024 * 1024, 1));

  const { code, output } = build(dir);
  check(code === 0, 'build passes');
  check(output.includes('reserved address'), 'warning: text page with a reserved name was skipped');
  check(output.includes('does-not-exist.jpg') && output.includes('gone.jpg') && output.includes('also-missing.jpg'), 'warning: missing photos were left out');
  check(output.includes('huge.jpg'), 'warning: oversized or unreadable photo is reported');
  check(output.includes('no-name') && output.includes('no group'), 'warning: person without a group is reported');
  if (code === 0) {
    const everything = allHtml(dir);
    check(!/javascript:/i.test(everything), 'no javascript: links in the output');
    const broken = brokenReferences(dir);
    check(broken.length === 0, `no broken local links, images or srcset URLs${broken.length ? ': ' + broken.join(', ') : ''}`);
    check(read(dir, 'en/festival/program/index.html').includes('title-band') && !read(dir, 'en/festival/program/index.html').includes('Should be skipped'), '/festival/program/ is still the real program page, not the clashing text page');
    check(read(dir, 'en/festival/teachers/index.html').includes('no-name'), 'person without a name or group falls back to the file name and the teachers page');
    check(read(dir, 'en/festival/artists/index.html').includes('Csak magyarul.'), 'a missing English text falls back to the Hungarian one');
    check(read(dir, 'hu/festival/index.html').includes('three-day international gathering'), 'a missing Hungarian text falls back to the English one');
    check(fs.existsSync(dist(dir, 'en/festival/untitled/index.html')), 'text page without a title still builds');
    check(/url=\/en\//.test(read(dir, 'index.html')), 'an invalid main language falls back to English');
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[3] Known limit: malformed file syntax');
{
  const dir = copyProject('syntax');
  fs.writeFileSync(path.join(dir, 'src/content/people/broken-syntax.json'), '{ "name": "oops", ');
  const { code } = build(dir);
  check(code !== 0, 'a malformed JSON file fails the build (expected; the host then keeps the previous version)');
}

/* ------------------------------------------------------------------ */
console.log('\n[4] Served under a sub-path (GitHub Pages project site: name.github.io/repo-name/)');
{
  const dir = copyProject('subpath');
  fs.writeFileSync(
    path.join(dir, 'src/content/pages/base-test.json'),
    JSON.stringify({
      title_en: 'Base test',
      body_en: 'See the [program](/en/festival/program/), [outside](https://example.org/x) and ![pic](/uploads/placeholder-hero.jpg).',
    }),
  );
  const { code } = build(dir, { SITE_URL: 'https://someone.github.io', SITE_BASE: '/repo-name' });
  check(code === 0, 'build passes with SITE_BASE=/repo-name');
  if (code === 0) {
    const broken = brokenReferences(dir, '/repo-name');
    check(broken.length === 0, `every local link, image and srcset URL carries the base path and resolves${broken.length ? ': ' + broken.join(', ') : ''}`);
    const page = read(dir, 'en/festival/base-test/index.html');
    check(page.includes('href="/repo-name/en/festival/program/"'), 'a link written in a text page was rewritten to include the base path');
    check(page.includes('src="/repo-name/uploads/placeholder-hero.jpg"'), 'an image written in a text page was rewritten to include the base path');
    check(page.includes('href="https://example.org/x"'), 'external link left alone');
    check(read(dir, 'en/index.html').includes('<link rel="canonical" href="https://someone.github.io/repo-name/en/"'), 'canonical address includes site and base');
    check(read(dir, 'index.html').includes('/repo-name/en/'), 'the root redirect carries the base path');
    check(/property="og:image" content="https:\/\/someone\.github\.io\/repo-name\//.test(read(dir, 'en/festival/index.html')), 'the sharing image is a full address including the base path');
  }
}

/* ------------------------------------------------------------------ */
for (const d of tmpDirs) {
  try {
    const link = path.join(d, 'node_modules');
    if (fs.existsSync(link)) fs.unlinkSync(link);
    fs.rmSync(d, { recursive: true, force: true });
  } catch {
    /* temporary folder, safe to leave */
  }
}
console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
