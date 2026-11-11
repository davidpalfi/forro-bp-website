// Makes web-sized copies of every photo in public/uploads, so editors can upload
// straight from a phone without slowing the site down.
// Output goes to public/_img (generated at build time, not committed), plus a
// manifest the site reads to build responsive <img> tags.
//
// If anything goes wrong with a single photo, it is skipped and the site falls
// back to the original file. This script never fails the build.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'public', 'uploads');
const OUT = path.join(ROOT, 'public', '_img');
const WIDTHS = [480, 960, 1600];
const MAX_WIDTH = WIDTHS[WIDTHS.length - 1];
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // no uploads folder yet
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function isFresh(outFile, srcMtime) {
  try {
    return (await fs.stat(outFile)).mtimeMs >= srcMtime;
  } catch {
    return false;
  }
}

const manifest = {};
await fs.mkdir(OUT, { recursive: true });

for await (const file of walk(SRC)) {
  if (!EXTENSIONS.has(path.extname(file).toLowerCase())) continue;

  const rel = path.relative(SRC, file).split(path.sep).join('/');
  try {
    const { mtimeMs, size } = await fs.stat(file);
    if (size > 8 * 1024 * 1024) console.warn(`[content-warning] photo ${rel} is ${(size / 1048576).toFixed(1)} MB; it works, but a smaller file uploads and builds faster`);
    const meta = await sharp(file).metadata();

    // Phones store rotation in EXIF; orientation 5-8 means width and height are swapped.
    let { width, height } = meta;
    if (meta.orientation && meta.orientation >= 5) [width, height] = [height, width];
    if (!width || !height) throw new Error('could not read image size');

    const base = rel.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9/_-]+/g, '-');
    const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, MAX_WIDTH)])];

    const variants = [];
    for (const w of widths) {
      const outRel = `${base}-${w}.webp`;
      const outFile = path.join(OUT, outRel);
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      if (!(await isFresh(outFile, mtimeMs))) {
        await sharp(file)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(outFile);
      }
      variants.push({ w, url: `/_img/${outRel}` });
    }
    manifest[`/uploads/${rel}`] = { width, height, variants };
  } catch (err) {
    console.warn(`[content-warning] photo skipped ${rel}: ${err.message}`);
  }
}

await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[images] ${Object.keys(manifest).length} photo(s) ready`);
