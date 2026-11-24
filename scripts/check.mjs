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
// layout on phones, and anything about the live Studio or hosting. See docs/HANDOFF.md.

import { createHash } from 'node:crypto';
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

/**
 * Signs of the click-to-edit preview in a public build: the editing script (or its bundle),
 * click targets on photos, or the invisible markers that tie texts to their fields.
 */
function previewTraces(dir) {
  const found = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(html|js|css)$/.test(e.name)) {
        const t = fs.readFileSync(p, 'utf8');
        if (/enableVisualEditing|@sanity\/visual-editing|preview-client|data-sanity=/.test(t)) found.push(`${e.name} (editing script or click target)`);
        else if (/[\u200b-\u200d\ufeff]{4,}/.test(t)) found.push(`${e.name} (invisible markers)`);
      }
    }
  };
  walk(path.join(dir, 'dist'));
  return found;
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
console.log('\n[0] The content fits the Sanity Studio schema');
{
  const r = spawnSync(process.execPath, ['--import', './scripts/lib/ts-resolve.mjs', 'scripts/check-schema.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  check(r.status === 0, `every field written by the JSON conversion and the test content exists in studio/schemaTypes${r.status === 0 ? '' : ':\n      ' + out.split('\n').join('\n      ')}`);
}

/* ------------------------------------------------------------------ */
let realDir = '';
console.log('\n[1] Real content');
{
  const dir = copyProject('real');
  realDir = dir;
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
    check(!/(?:href|src|action)\s*=\s*["']?\s*javascript:/i.test(allHtml(dir)), 'no javascript: links in the output');
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
    check(!/(?:href|src|action)\s*=\s*["']?\s*javascript:/i.test(everything), 'no javascript: links in the output (as text it is harmless)');
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
console.log('\n[4] Served under a sub-path (a project site at a sub-path, e.g. name.github.io/repo-name/)');
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
console.log('\n[5] Built from the Sanity import file (what npm run sanity:import sends)');
{
  const dir = copyProject('importfile');
  const made = spawnSync(process.execPath, ['scripts/make-sanity-import.mjs'], { cwd: dir, encoding: 'utf8' });
  check(made.status === 0 && fs.existsSync(path.join(dir, 'sanity-import/data.ndjson')), 'the import file is written');
  const lines = fs.readFileSync(path.join(dir, 'sanity-import/data.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const ids = lines.map((d) => d._id);
  check(new Set(ids).size === ids.length && ids.every((id) => /^[A-Za-z0-9_-]+$/.test(id)), 'every document has its own fixed id, without dots (dotted ids are hidden from public reads)');
  const people = jsonFiles('src/content/people').length;
  check(lines.filter((d) => d._type === 'person').length === people, `all ${people} people are in the import file`);
  check(!JSON.stringify(lines).includes('_upload'), 'every photo is either an upload instruction or left out');
  check(JSON.stringify(lines).includes('"_sanityAsset"') && !JSON.stringify(lines).includes('"asset":{"_sanityAsset"'), 'upload instructions sit on the photo itself, not inside its asset (which made a photo within a photo)');
  const made2 = spawnSync(process.execPath, ['scripts/make-sanity-import.mjs'], { cwd: dir, encoding: 'utf8' });
  const again = fs.readFileSync(path.join(dir, 'sanity-import/data.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  check(made2.status === 0 && JSON.stringify(again) === JSON.stringify(lines), 'making the import file twice gives exactly the same file (safe to repeat)');
  const { code } = build(dir, { CONTENT_SOURCE: 'file:sanity-import/data.ndjson' });
  check(code === 0, 'build passes with CONTENT_SOURCE=file:sanity-import/data.ndjson');
  if (code === 0 && realDir) {
    const rel = (d) => htmlFiles(d).map((f) => path.relative(path.join(d, 'dist'), f)).sort();
    const a = rel(realDir);
    const b = rel(dir);
    const differ = a.filter((f) => !b.includes(f) || fs.readFileSync(path.join(realDir, 'dist', f), 'utf8') !== fs.readFileSync(path.join(dir, 'dist', f), 'utf8'));
    check(a.length === b.length && differ.length === 0, `the site built from the import file is identical to the site built from the JSON files${differ.length ? ': differs in ' + differ.join(', ') : ''}`);
  }
}

/* ------------------------------------------------------------------ */
{
  const codes = (f) => [...fs.readFileSync(f, 'utf8').matchAll(/id: '(\w+)', name: '([^']+)', code: '(#\w+)', text: '(#\w+)'/g)].map((m) => m.slice(1).join(' ')).join(', ');
  const site = codes('src/lib/palette.ts');
  check(site !== '' && site === codes('studio/schemaTypes/palette.ts'), 'the built-in colours are the same on the site and in the Studio');
  const fonts = (f) => [...fs.readFileSync(f, 'utf8').matchAll(/\{ id: '(\w+)', name: '([^']+)'/g)].map((m) => m.slice(1).join(' ')).join(', ');
  check(fonts('src/lib/fonts.ts') !== '' && fonts('src/lib/fonts.ts') === fonts('studio/schemaTypes/fonts.ts'), 'the fonts are the same on the site and in the Studio');
}

console.log('\n[6] Sanity-shaped content: uploaded photos, every block, editor mistakes');
{
  const dir = copyProject('sanity');
  const { makeFixture } = await import('./lib/sanity-fixture.mjs');
  const docs = makeFixture(path.join(dir, 'src/content'));
  // One photo stored as the first import of 2026-11-18 stored them: a photo within a photo.
  const nested = docs.find((d) => d._type === 'person' && d.photo?.asset?._ref);
  const nestedRef = nested.photo.asset._ref;
  nested.photo = { _type: 'imageWithAlt', asset: { _type: 'image', asset: nested.photo.asset } };
  // A bio pasted from another site: an "empty" line holding a zero-width space, and a single line break.
  const linePerson = docs.find((d) => d._type === 'person' && d.name === 'Gisa');
  linePerson.bio_en = 'First paragraph.\n\u200b\nSecond paragraph,\nsame paragraph.';
  // Event calendar: a month that is over, this month, next month, next month again, one without a month.
  const today = new Date();
  const ym = (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1 });
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const pic = (n) => ({ _type: 'imageWithAlt', asset: { _type: 'reference', _ref: `image-${String(n).repeat(40)}-800x600-png` } });
  docs.find((d) => d._id === 'page-everything').blocks.push({
    _type: 'eventCalendarBlock',
    _key: 'cal',
    months: [
      { _key: 'm1', year: 2020, month: 1, image: pic(1) },
      { _key: 'm2', ...ym(nextMonth), image: pic(2) },
      { _key: 'm3', ...ym(today), image: pic(3) },
      { _key: 'm4', ...ym(nextMonth), image: pic(4) },
      { _key: 'm5', image: pic(5) },
    ],
    background: 'default',
    alignment: 'center',
  });
  // The community home's headline banner: headline, short line, a page button and an address button.
  Object.assign(docs.find((d) => d._type === 'communitySettings'), {
    title_en: 'Headline for the community',
    subtitle_en: 'A short line under it.',
    heroButtons: [
      { _key: 'h1', _type: 'heroButton', label_en: 'First button', page: { _type: 'reference', _ref: 'page-location' } },
      { _key: 'h2', _type: 'heroButton', label_en: 'Second button', url: '/festival/' },
      { _key: 'h3', _type: 'heroButton', label_en: 'Third button', url: '/festival/' },
    ],
  });
  // The palette: Mustard with a new code, a new colour "Pink" used by a page and a block, the
  // community language list in Light cream, a bad code and a colour with unreadable text.
  Object.assign(docs.find((d) => d._type === 'siteSettings'), {
    colours: [
      { _key: 'gold', _type: 'paletteColour', builtin: 'gold', name: 'Mustard', code: '#d4a03a' },
      { _key: 'pink1', _type: 'paletteColour', name: 'Pink', code: '#f1d0c2', text: '#2e2e2e' },
      { _key: 'bad1', _type: 'paletteColour', name: 'Broken', code: 'mustard' },
      { _key: 'grey1', _type: 'paletteColour', name: 'Grey on grey', code: '#777777', text: '#888888' },
    ],
    communityLanguageListColour: 'light',
    scrollbarColour: 'cpink1',
    // Fonts: Inter for the menu and buttons, the usual font chosen by name, and an unknown one.
    boldFont: 'inter',
    headingFont: 'fraunces',
    titleFont: 'comic-sans',
  });
  Object.assign(docs.find((d) => d._type === 'page' && d.slug?.current === 'code-of-conduct'), { tone: 'cpink1' });
  // A mustard page.
  Object.assign(docs.find((d) => d._type === 'page' && d.slug?.current === 'location'), { tone: 'gold' });
  // The festival button in the community menu as a page: after the other community pages, with its own name.
  docs.push({ _id: 'page-to-festival', _type: 'page', title_en: 'Our festival', menuLabel_en: 'Festival', section: 'community', goesTo: 'festival', order: 999, blocks: [] });
  // Two logos: the big one on the banner, the small one in the top bar.
  const festivalDoc = docs.find((d) => d._type === 'festivalSettings');
  festivalDoc.logo = { _type: 'image', asset: { _type: 'reference', _ref: 'image-' + 'a'.repeat(40) + '-800x400-png' } };
  festivalDoc.headerLogo = { _type: 'image', asset: { _type: 'reference', _ref: 'image-' + 'b'.repeat(40) + '-200x100-png' } };
  festivalDoc.tabIcon = { _type: 'image', asset: { _type: 'reference', _ref: 'image-' + 'd'.repeat(40) + '-64x64-png' } };
  // A banner video (an uploaded MP4 file).
  festivalDoc.heroVideo = { _type: 'file', asset: { _type: 'reference', _ref: 'file-' + 'c'.repeat(40) + '-mp4' } };
  fs.writeFileSync(path.join(dir, 'fixture.ndjson'), docs.map((d) => JSON.stringify(d)).join('\n'));
  const { code, output } = build(dir, { CONTENT_SOURCE: 'file:fixture.ndjson' });
  check(code === 0, 'build passes');
  for (const [text, what] of [
    ['unknown kind (mysteryBlock)', 'a block of an unknown kind'],
    ['not published (page-nope)', 'a button to a missing page'],
    ['same address as another page (location)', 'two pages with the same address'],
    ['reserved address (festival)', 'a community page called "festival"'],
    ['"No address" has no usable address', 'a page without an address'],
    ['not a YouTube or Vimeo address', 'a video from another site'],
    ['person-musician" has no group', 'a person in an unknown group'],
    ['"javascript:alert(1)" is not a usable address', 'an unsafe button link'],
    ['photos in Sanity are stored the wrong way', 'a photo within a photo (first import)'],
    ['has no year or month and was skipped', 'an event calendar month without a month'],
    ['twice; only the first is shown', 'the same event calendar month twice'],
    ['the colour "Broken" has no usable colour code', 'a colour with a bad code'],
    ['text on the colour "Grey on grey" is hard to read', 'a colour whose text is hard to read'],
  ]) check(output.includes(text), `warning: ${what}`);
  if (code === 0) {
    const page = read(dir, 'en/festival/everything/index.html');
    const pageHu = read(dir, 'hu/festival/everything/index.html');
    const everything = allHtml(dir);
    check(/src="https:\/\/cdn\.sanity\.io\/images\/8hc671sk\/production\/[0-9a-f]+-1600x1200\.jpg\?rect=320,120,1280,1080/.test(read(dir, 'en/festival/teachers/index.html')), 'photos come from Sanity\'s image service with the editor\'s crop');
    check(read(dir, 'en/festival/teachers/index.html').includes('object-position: 50% 44%'), 'the editor\'s focus point decides which part of a cropped photo shows');
    check(page.includes('alt="Dancers on the island"') && page.includes('alt="Full width photo"'), 'photo descriptions are used');
    check(page.includes('href="/en/festival/program/"') && pageHu.includes('href="/hu/festival/program/"'), 'a site link written without a language gets the visitor\'s language');
    check(page.includes('href="/en/festival/location/"') && page.includes('>Location<'), 'a button to a page uses its address and, without its own text, its menu name');
    check(!page.includes('Evil button') && !/(?:href|src)="\s*javascript:/i.test(everything), 'a button with an unsafe link is left out');
    check(page.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'a YouTube video is embedded without tracking cookies');
    check(/<ul class="gallery gallery--mosaic">/.test(page) && (page.match(/<a class="gallery-open" href="https:\/\/cdn\.sanity\.io\//g) || []).length >= 2 && page.includes('lightbox'), 'a gallery can be a mosaic, and each photo opens large in the photo viewer');
    {
      const months = [...page.matchAll(/data-month="(\d{4}-\d{2})"/g)].map((m) => m[1]);
      check(months.length === 2 && months[0] < months[1] && !page.includes('1'.repeat(40)) && page.includes('2'.repeat(40)) && page.includes('3'.repeat(40)) && !page.includes('4'.repeat(40)) && page.includes('data-cal-nav') && (page.match(/<p class="cal-empty"/g) || []).length === 1, 'the event calendar shows this month and later in order, each month once with its picture, with the month switcher');
    }
    check(/<a class="gallery-open image-open" href="https:\/\/cdn\.sanity\.io\//.test(page), 'an Image block opens large in the photo viewer');
    check(/<picture><source media="\(max-width: 719px\)" srcset="https:\/\/cdn\.sanity\.io\/[^"]*/.test(page.replace(/>\s+</g, '><')) && page.includes(createHash('sha1').update('full-phone').digest('hex')) && /data-phone-src="https:\/\/cdn\.sanity\.io\//.test(page), 'an Image block with a phone version shows it on narrow screens and in the photo viewer there');
    check(['A small heading', 'Banner title', 'Banner button', 'Column three', 'A caption', 'b-divider', 'b-space', 'A statement line'].every((t) => page.includes(t)), 'every kind of block is shown');
    check(page.indexOf('>Gisa<') > -1 && page.indexOf('>Gisa<') < page.indexOf('>Dóri Czakó<'), 'a People block with chosen people shows them in the chosen order');
    check(/<main id="main" class="tone-dark"/.test(page), 'the page colour is used');
    check(/<h2 class="b-wide b-heading[^"]*">Gallery heading</.test(page) && /<h3 class="b-text b-heading[^"]*">A small heading</.test(page), 'a heading takes the width of the block under it (gallery: wide, text: text width)');
    check(/<main id="main" class="tone-gold"/.test(read(dir, 'en/festival/location/index.html')), 'a page can be mustard');
    {
      const coc = read(dir, 'en/festival/code-of-conduct/index.html');
      const home = read(dir, 'en/index.html');
      check(coc.includes('--c-gold:#d4a03a') && coc.includes('--c-cpink1:#f1d0c2') && /<main id="main" class="tone-cpink1"/.test(coc) && coc.includes('body .bg-cpink1,body main.tone-cpink1{') && !coc.includes('Broken'), 'the palette from Site settings: a changed code, a new colour used by a page, a bad code left out');
      check(coc.includes("html:root{--sans:'Inter Variable', 'Helvetica Neue', Arial, sans-serif}") && !coc.includes('--serif:') && !coc.includes('--title:'), 'a font chosen in Site settings replaces the usual one; the usual one or an unknown one changes nothing');
      check(output.includes('[content-warning] the font "comic-sans" chosen for page titles'), 'an unknown font is a warning');
      check(/<details class="lang" style="--langlist-bg:var\(--c-light\)/.test(home) && !/<details class="lang" style/.test(coc), 'the language list colour can be set per part of the site');
      check(/scrollbar-color:color-mix\(in srgb,var\(--c-cpink1-text\) 40%,var\(--c-cpink1\)\) var\(--c-cpink1\)/.test(home), 'the scroll bar colour comes from Site settings');
    }
    check(everything.includes('<p class="person-bio">First paragraph.</p>') && /<p class="person-bio">Second paragraph,\s+same paragraph\.<\/p>/.test(everything), 'in a bio an empty line (even one with an invisible character) starts a paragraph, a single line break does not');
    {
      const home = read(dir, 'en/festival/index.html');
      const brand = /<img[^>]*class="brand-logo"[^>]*>/.exec(home)?.[0] ?? '';
      check(brand.includes('b'.repeat(40)) && home.includes('a'.repeat(40)) && !brand.includes('a'.repeat(40)), 'the top bar shows the small logo and the banner the big one');
      check(/<link rel="icon" href="[^"]*d{40}[^"]*fm=png/.test(home) && read(dir, 'en/index.html').includes('<link rel="icon" href="/uploads/forro-budapest-logo.png">'), 'the festival tab icon is its own upload; the community one falls back to the community logo; both as PNG');
      const video = /<video[^>]*class="hero-video"[^>]*>/.exec(home)?.[0] ?? '';
      check(video.includes(`data-hero-video="https://cdn.sanity.io/files/8hc671sk/production/${'c'.repeat(40)}.mp4"`) && video.includes('data-type="video/mp4"') && video.includes('preload="none"') && video.includes('muted') && !/\s(?:src|autoplay)=?/.test(video) && home.includes('class="hero-photo"') && home.includes('video[data-hero-video]'), 'the banner video is in the banner over the photo, loaded only by the script (so phones never download it)');
      check(!read(dir, 'en/festival/program/index.html').includes('<video'), 'the banner video is only on the festival home');
    }
    {
      const nav = /<nav id="menu"[\s\S]*?<\/nav>/.exec(read(dir, 'en/index.html'))?.[0] ?? '';
      check(nav.indexOf('href="/en/classes/"') > -1 && nav.indexOf('href="/en/classes/"') < nav.indexOf('>Festival<') && (nav.match(/href="\/en\/festival\/"/g) || []).length === 1, 'a community page set to go to the festival is the festival button in the menu, with its own order and label');
      check(!read(dir, 'en/index.html').includes('class="band band--red band--center"'), 'the community home has no festival section');
      const home = read(dir, 'en/index.html');
      check(/<main id="main" class="tone-cream"/.test(home) && home.includes('class="chero '), 'the community home is cream under its mustard headline banner');
      check(home.includes('>Headline for the community</h1>') && home.includes('A short line under it.') && /href="\/en\/festival\/location\/"[^>]*>\s*First button/.test(home) && home.includes('button--ghost') && !home.includes('Third button'), 'the community home banner shows the headline, the short line and at most two buttons');
    }
    check(fs.existsSync(dist(dir, 'en/classes/index.html')) && read(dir, 'en/index.html').includes('href="/en/classes/"'), 'a community page gets its own address and appears in the community menu');
    check(read(dir, 'en/festival/index.html').includes('href="/en/festival/everything/"'), 'a new festival page appears in the festival menu');
    check(!everything.includes('DRAFT TITLE'), 'drafts never reach the public site');
    check(read(dir, 'en/festival/broken/index.html').includes('<em>markdown</em>'), 'a text saved as a plain string is still shown');
    check(read(dir, 'en/festival/location/index.html').includes('Kristály Színtér'), 'of two pages with the same address, the one first in the menu order is kept');
    const hosts = new Set([...everything.matchAll(/(?:src|srcset)="(https?:\/\/[^/"]+)/g)].map((m) => m[1]));
    const allowed = ['https://cdn.sanity.io', 'https://www.youtube-nocookie.com'];
    check([...hosts].every((h) => allowed.includes(h)), `outside files come only from Sanity's image service and YouTube without cookies${[...hosts].filter((h) => !allowed.includes(h)).map((h) => ': ' + h).join('')}`);
    check(everything.includes(nestedRef.replace(/^image-/, '').replace(/-([a-z0-9]+)$/, '.$1')), 'a photo within a photo (first import) is still shown');
    const broken = brokenReferences(dir);
    check(broken.length === 0, `no broken local links${broken.length ? ': ' + broken.join(', ') : ''}`);
    const traces = previewTraces(dir);
    check(traces.length === 0, `no click-to-edit script, click targets or text markers in a public build from Sanity${traces.length ? ': ' + traces.join(', ') : ''}`);
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[7] Click-to-edit preview stays out of the public site');
{
  if (realDir) {
    const traces = previewTraces(realDir);
    check(traces.length === 0, `no click-to-edit script, click targets or text markers in the public build${traces.length ? ': ' + traces.join(', ') : ''}`);
  }
  const config = fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf8');
  check(/const preview = process\.env\.PREVIEW === '1'/.test(config) && /\.\.\.\(preview\s*\?/.test(config), 'server rendering and the editing script are switched on only by PREVIEW=1');
  const layout = fs.readFileSync(path.join(ROOT, 'src/layouts/Base.astro'), 'utf8');
  check(!/visual-editing|preview-client/.test(layout), 'the page layout itself never loads the editing script');
  const ignored = spawnSync('git', ['check-ignore', '-q', '.env'], { cwd: ROOT });
  check(ignored.status === 0, 'the .env file (preview token) is ignored by git');
  check(/const hosted = preview &&/.test(config) && /hosted \? \(await import\('@astrojs\/cloudflare'\)\)/.test(config), 'the Cloudflare adapter is loaded only for the hosted preview');
  if (realDir) {
    const lockTraces = htmlFiles(realDir).filter((f) => /preview\/enable|fb-preview|unpublished changes are hidden/.test(fs.readFileSync(f, 'utf8')));
    check(lockTraces.length === 0 && !fs.existsSync(dist(realDir, 'preview')), 'the public build has no preview lock or its address');
    check(!fs.existsSync(dist(realDir, 'server')) && !fs.existsSync(dist(realDir, '_worker.js')), 'the public build is plain files, with no server code');
  }
  for (const f of ['wrangler.jsonc', 'wrangler.site.jsonc']) {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    check(!/SANITY_VIEWER_TOKEN"\s*:/.test(t) && !/sk[A-Za-z0-9]{40,}/.test(t), `${f} holds no token`);
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[8] The hosted preview: Cloudflare runtime, preview lock, drafts, update without reload');
failures += (await import('./check-preview.mjs')).default;

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
