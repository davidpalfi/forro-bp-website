// Checks that content documents fit the Sanity Studio schema (studio/schemaTypes): every
// field exists, choice fields hold one of their choices, rich text uses the allowed styles.
// It catches the mapping from JSON (src/lib/from-json.ts) drifting away from the schema.
//
//   node --import ./scripts/lib/ts-resolve.mjs scripts/check-schema.mjs
//
// Run by npm run check. Prints one line per problem; exit code 1 if there is any.

import path from 'node:path';
import { jsonToDocuments } from '../src/lib/from-json.ts';
import { makeFixture, BROKEN_IDS } from './lib/sanity-fixture.mjs';

const { schemaTypes } = await import('../studio/schemaTypes/index.ts');
const types = new Map(schemaTypes.map((t) => [t.name, t]));
const problems = [];
const problem = (where, msg) => problems.push(`${where}: ${msg}`);

const choiceValues = (options) =>
  Array.isArray(options?.list) ? options.list.map((o) => (o && typeof o === 'object' ? o.value : o)) : null;

/** Follows named types (e.g. "imageWithAlt" -> image with alt fields) down to a base kind. */
function resolve(def) {
  let d = def;
  const seen = new Set();
  while (types.has(d.type) && !seen.has(d.type)) {
    seen.add(d.type);
    const named = types.get(d.type);
    d = { ...named, ...d, type: named.type, fields: d.fields ?? named.fields, of: d.of ?? named.of, options: d.options ?? named.options };
  }
  return d;
}

function checkBlock(value, def, where) {
  const styles = (def.styles ?? []).map((s) => s.value);
  const lists = (def.lists ?? []).map((l) => l.value);
  const decorators = (def.marks?.decorators ?? []).map((m) => m.value);
  const annotations = (def.marks?.annotations ?? []).map((a) => a.name);
  if (value.style && !styles.includes(value.style)) problem(where, `text style "${value.style}" is not offered (${styles.join(', ')})`);
  if (value.listItem && !lists.includes(value.listItem)) problem(where, `list type "${value.listItem}" is not offered`);
  const defs = new Set();
  for (const m of value.markDefs ?? []) {
    if (!annotations.includes(m._type)) problem(where, `link type "${m._type}" is not offered`);
    defs.add(m._key);
  }
  for (const c of value.children ?? []) {
    for (const mark of c.marks ?? []) if (!decorators.includes(mark) && !defs.has(mark)) problem(where, `mark "${mark}" is not offered`);
  }
}

function check(value, def, where) {
  if (value === undefined || value === null) return;
  const d = resolve(def);
  switch (d.type) {
    case 'string':
    case 'text':
    case 'url': {
      if (typeof value !== 'string') return problem(where, `should be text, is ${typeof value}`);
      const choices = choiceValues(d.options);
      if (choices && !choices.includes(value)) problem(where, `"${value}" is not one of ${choices.join(', ')}`);
      return;
    }
    case 'number': {
      if (typeof value !== 'number') return problem(where, `should be a number, is ${typeof value}`);
      const choices = choiceValues(d.options);
      if (choices && !choices.includes(value)) problem(where, `${value} is not one of ${choices.join(', ')}`);
      return;
    }
    case 'boolean':
      if (typeof value !== 'boolean') problem(where, `should be true/false, is ${typeof value}`);
      return;
    case 'slug':
      if (typeof value?.current !== 'string') problem(where, 'slug without "current"');
      return;
    case 'reference':
      if (typeof value?._ref !== 'string') problem(where, 'reference without "_ref"');
      return;
    case 'block':
      return checkBlock(value, d, where);
    case 'array': {
      if (!Array.isArray(value)) return problem(where, 'should be a list');
      const members = d.of ?? [];
      value.forEach((item, i) => {
        const w = `${where}[${i}]`;
        if (item && typeof item === 'object' && members.length > 1 && !item._key) problem(w, 'list item without _key');
        const itemType = item?._type;
        const member =
          members.find((m) => m.type === itemType || m.name === itemType) ??
          (members.length === 1 ? members[0] : undefined) ??
          (itemType === 'reference' ? members.find((m) => m.type === 'reference') : undefined);
        if (!member) return problem(w, `block kind "${itemType}" is not offered here`);
        check(item, member, w);
      });
      return;
    }
    case 'image':
    case 'object':
    case 'document': {
      if (typeof value !== 'object' || Array.isArray(value)) return problem(where, 'should be an object');
      const fields = new Map((d.fields ?? []).map((f) => [f.name, f]));
      const imageKeys = d.type === 'image' ? ['asset', 'crop', 'hotspot', 'media'] : [];
      for (const [key, v] of Object.entries(value)) {
        if (key.startsWith('_') || imageKeys.includes(key)) continue;
        const f = fields.get(key);
        if (!f) problem(where, `field "${key}" does not exist in the schema`);
        else check(v, f, `${where}.${key}`);
      }
      return;
    }
    default:
      problem(where, `unknown schema type "${d.type}"`);
  }
}

const contentDir = path.join(process.cwd(), 'src', 'content');
const sets = [
  ['JSON content', jsonToDocuments(contentDir)],
  ['test content', makeFixture(contentDir).filter((d) => !BROKEN_IDS.includes(d._id))],
];
for (const [label, docs] of sets) {
  for (const doc of docs) {
    if (!types.has(doc._type)) {
      problem(`${label} ${doc._id}`, `document type "${doc._type}" does not exist`);
      continue;
    }
    check(doc, { type: doc._type }, `${label} ${doc._id}`);
  }
}

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`The content fits the Studio schema (${sets.map(([l, d]) => `${d.length} ${l} documents`).join(', ')}).`);
