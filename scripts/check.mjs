// npm run check
//
// Builds the real content, then a deliberately broken copy, and asserts the results.
// Takes about 20-40 seconds. Exit code 1 if anything fails. Nothing in the repo is changed:
// the broken content only exists in temporary copies.
//
// What this cannot check (needs a browser): that past events hide themselves, layout on phones,
// and anything about the live Pages CMS or hosting. See docs/HANDOFF.md for how to check those.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const tmpDirs = [];
let failures = 0;

const check = (condition, message) => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) failures++;
};

function copyProject(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `festival-${label}-`));
  tmpDirs.push(dir);
  const skip = new Set(['node_modules', 'dist', '.astro', '_img', '.git']);
  fs.cpSync(ROOT, dir, { recursive: true, filter: (src) => !skip.has(path.basename(src)) });
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}

function build(dir, extraEnv = {}) {
  // Builds 1-3 run with no address settings, so a stray SITE_URL/SITE_BASE in your shell cannot change them.
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
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, rel, f), 'utf8')));

/* ------------------------------------------------------------------ */
console.log('\n[1] Real content');
{
  const dir = copyProject('real');
  const { code, output } = build(dir);
  check(code === 0, 'build passes');
  for (const route of ['index.html', 'program/index.html', 'people/index.html', '404.html']) {
    check(fs.existsSync(dist(dir, route)), `route exists: ${route}`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'src/content/pages')).filter((f) => f.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    check(fs.existsSync(dist(dir, `${slug}/index.html`)), `text page exists: /${slug}/`);
  }
  if (code === 0) {
    const program = read(dir, 'program/index.html');
    const people = read(dir, 'people/index.html');
    const events = jsonFiles('src/content/events').filter((e) => /^\d{4}-\d{2}-\d{2}/.test(e.date ?? ''));
    check(events.length > 0 && events.every((e) => program.includes(esc(e.title))), 'every dated event is on the program page');
    const names = jsonFiles('src/content/people').map((p) => p.name).filter(Boolean);
    check(names.every((n) => people.includes(esc(n))), 'every person is on the people page');
    check(!/javascript:/i.test(allHtml(dir)), 'no javascript: links in the output');
    const broken = brokenReferences(dir);
    check(broken.length === 0, `no broken local links, images or srcset URLs${broken.length ? ': ' + broken.join(', ') : ''}`);
    const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/settings/site.json'), 'utf8'));
    check(
      /name="robots" content="noindex/.test(read(dir, 'index.html')) === (site.noindex !== false),
      'noindex meta tag matches the setting in site.json',
    );
    check(!/\[content-warning\]/.test(output), 'no [content-warning] lines in the build log for the real content');
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[2] Deliberately broken content (the site must still build)');
{
  const dir = copyProject('broken');
  const c = (rel) => path.join(dir, 'src/content', rel);
  const put = (rel, value) => fs.writeFileSync(c(rel), typeof value === 'string' ? value : JSON.stringify(value));

  put('events/bad-no-date.json', { title: 'No date event', date: '', people: [] });
  put('events/bad-impossible-date.json', { title: 'Impossible date', date: '2027-13-45' });
  put('events/bad-types.json', {
    title: 123,
    date: '2027-06-22',
    startTime: 20,
    url: 'javascript:alert(1)',
    people: 'src/content/people/teacher-anna.json',
  });
  put('events/bad-ref.json', {
    title: 'Deleted teacher',
    date: '2027-06-23',
    people: ['src/content/people/deleted-person.json'],
  });
  put('people/no-name.json', {
    name: null,
    role: null,
    photo: '/uploads/does-not-exist.jpg',
    link: 'javascript:alert(1)',
    featured: 'yes',
    order: 'abc',
  });
  put('links/evil.json', { label: 'Evil', url: 'javascript:alert(1)', kind: null, order: null });
  put('pages/program.md', '---\ntitle: Clash\n---\nShould be skipped.\n');
  put('pages/untitled.md', '---\n---\nBody only.\n');

  const site = JSON.parse(fs.readFileSync(c('settings/site.json'), 'utf8'));
  Object.assign(site, { tagline: null, facebook: null, ticketUrl: 'not a url' });
  delete site.labels;
  put('settings/site.json', site);
  const home = JSON.parse(fs.readFileSync(c('settings/home.json'), 'utf8'));
  Object.assign(home, { heroImage: '/uploads/also-missing.jpg', intro: null });
  put('settings/home.json', home);

  const { code, output } = build(dir);
  check(code === 0, 'build passes');
  check(output.includes('reserved address'), 'warning: text page with a reserved name was skipped');
  check(output.includes('bad-impossible-date') && output.includes('no valid date'), 'warning: impossible date was skipped');
  check(output.includes('bad-no-date'), 'warning: event without a date was skipped');
  check(output.includes('does-not-exist.jpg') && output.includes('also-missing.jpg'), 'warning: missing photos were left out');
  if (code === 0) {
    const everything = allHtml(dir);
    check(!/javascript:/i.test(everything), 'no javascript: links in the output');
    const broken = brokenReferences(dir);
    check(broken.length === 0, `no broken local links, images or srcset URLs${broken.length ? ': ' + broken.join(', ') : ''}`);
    const program = read(dir, 'program/index.html');
    check(program.includes('data-events') && program.includes('Beginner workshop'), '/program/ is still the real program page, not the clashing text page');
    check(program.includes('>123<') || program.includes('123\n'), 'wrong-typed title (a number) was kept as text');
    check(program.includes('Teacher Anna'), 'a single string in "people" still links the teacher');
    check(read(dir, 'index.html').includes('no-name'), 'person without a name falls back to the file name and "yes" counts as featured');
    check(fs.existsSync(dist(dir, 'untitled/index.html')), 'text page without a title still builds');
  }
}

/* ------------------------------------------------------------------ */
console.log('\n[3] Known limit: malformed file syntax');
{
  const dir = copyProject('syntax');
  fs.writeFileSync(path.join(dir, 'src/content/events/broken-syntax.json'), '{ "title": "oops", ');
  const { code } = build(dir);
  check(code !== 0, 'a malformed JSON file fails the build (expected; the host then keeps the previous version)');
}

/* ------------------------------------------------------------------ */
console.log('\n[4] Served under a sub-path (GitHub Pages project site: name.github.io/repo-name/)');
{
  const dir = copyProject('subpath');
  fs.writeFileSync(
    path.join(dir, 'src/content/pages/base-test.md'),
    '---\ntitle: Base test\n---\nSee the [program](/program/), [outside](https://example.org/x) and ![pic](/uploads/placeholder-hero.jpg).\n',
  );
  // A phone-sized photo that is too big, to check the warning.
  fs.writeFileSync(path.join(dir, 'public/uploads/huge.jpg'), Buffer.alloc(9 * 1024 * 1024, 1));
  const { code, output } = build(dir, { SITE_URL: 'https://someone.github.io', SITE_BASE: '/repo-name' });
  check(code === 0, 'build passes with SITE_BASE=/repo-name');
  check(output.includes('huge.jpg'), 'warning: unreadable or oversized photo is reported, not silently ignored');
  if (code === 0) {
    const broken = brokenReferences(dir, '/repo-name');
    check(broken.length === 0, `every local link, image and srcset URL carries the base path and resolves${broken.length ? ': ' + broken.join(', ') : ''}`);
    const page = read(dir, 'base-test/index.html');
    check(page.includes('href="/repo-name/program/"'), 'Markdown link /program/ was rewritten to include the base path');
    check(page.includes('src="/repo-name/uploads/placeholder-hero.jpg"'), 'Markdown image /uploads/... was rewritten to include the base path');
    check(page.includes('href="https://example.org/x"'), 'external Markdown link left alone');
    check(read(dir, 'index.html').includes('<link rel="canonical" href="https://someone.github.io/repo-name/"'), 'canonical address includes site and base');
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
