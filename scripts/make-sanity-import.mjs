// npm run sanity:import-file
//
// Writes the current content (src/content and the photos in public/uploads) as a Sanity
// import file, and prints a report. It does not contact Sanity and changes nothing there.
//
//   sanity-import/data.ndjson   one document per line
//   sanity-import/images/       the photos the documents use
//
// To send it to Sanity, on a computer where you are signed in (npm run sanity:login):
//
//   npm run sanity:import      (makes this file, then imports it with --missing)
//
// --missing only creates documents that are not in Sanity yet, so running it again never
// overwrites what the admin has changed. Use --replace instead only to reset Sanity to the
// JSON content (it overwrites those documents). Documents are never deleted.
// Every document has a fixed id (e.g. "person-dori-czako"), so repeats do not duplicate.

import fs from 'node:fs';
import path from 'node:path';
import { jsonToDocuments } from '../src/lib/from-json.ts';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'sanity-import');
const IMAGES = path.join(OUT, 'images');

const warnings = [];
const docs = jsonToDocuments(path.join(ROOT, 'src', 'content'), (w) => warnings.push(w));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(IMAGES, { recursive: true });

const copied = new Map(); // /uploads/x.jpg -> images/x.jpg
const missing = new Set();

/** Replaces each not-yet-uploaded photo with an instruction for the Sanity importer to upload it. */
function withAssets(value) {
  if (Array.isArray(value)) return value.map(withAssets).filter((v) => v !== undefined);
  if (!value || typeof value !== 'object') return value;
  if (typeof value._upload === 'string') {
    const { _upload, ...rest } = value;
    let local = _upload;
    try {
      local = decodeURI(_upload);
    } catch {
      /* keep as is */
    }
    const src = path.join(ROOT, 'public', local.replace(/^\/+/, ''));
    if (!/^\/uploads\//.test(local) || !fs.existsSync(src) || !fs.statSync(src).isFile()) {
      missing.add(_upload);
      return undefined;
    }
    if (!copied.has(local)) {
      const name = local.replace(/^\/uploads\//, '').replace(/[^A-Za-z0-9._-]+/g, '-');
      fs.copyFileSync(src, path.join(IMAGES, name));
      copied.set(local, `images/${name}`);
    }
    // The marker goes on the photo object itself; the importer uploads the file and sets
    // `asset` from it. (Inside `asset` it would make a photo within a photo: fixed 2026-11-18.)
    return { ...rest, _sanityAsset: `image@file://./${copied.get(local)}` };
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const mapped = withAssets(v);
    if (mapped !== undefined) out[k] = mapped;
  }
  return out;
}

const ready = docs.map(withAssets);
fs.writeFileSync(path.join(OUT, 'data.ndjson'), ready.map((d) => JSON.stringify(d)).join('\n') + '\n');

const byType = {};
for (const d of ready) byType[d._type] = (byType[d._type] ?? 0) + 1;

console.log(`Wrote ${path.relative(ROOT, path.join(OUT, 'data.ndjson'))}: ${ready.length} documents`);
for (const [type, n] of Object.entries(byType)) console.log(`  ${type.padEnd(18)} ${n}`);
console.log(`Photos copied: ${copied.size}`);
if (missing.size) console.log(`Photos not found, left out:\n  ${[...missing].join('\n  ')}`);
if (warnings.length) console.log(`Content warnings:\n  ${warnings.join('\n  ')}`);
console.log('\nDocument ids:\n  ' + ready.map((d) => d._id).join('\n  '));
console.log(`
Nothing was sent to Sanity. To import it (after "npm run sanity:login" once):
  npm run sanity:import`);
