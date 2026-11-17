// Where the site's content comes from. Chosen with the CONTENT_SOURCE environment variable:
//
//   (not set) or json   the JSON files in src/content, converted to Sanity documents by
//                       from-json.ts (the proof-of-concept content; no network needed)
//   sanity              the published content in Sanity, read at build time over HTTPS
//   file:<path>         Sanity documents from an .ndjson file, e.g. the import file made by
//                       npm run sanity:import-file, or an unpacked `sanity dataset export`
//
// Sanity settings (none of them secret): SANITY_PROJECT_ID (default 8hc671sk),
// SANITY_DATASET (default production). SANITY_READ_TOKEN is only needed if the dataset is
// private; it must be set in the host's secret settings, never in a file.
//
// If Sanity cannot be reached, or has no content, the build fails on purpose: the host then
// keeps the previous version of the site online instead of publishing an empty one.

import fs from 'node:fs';
import path from 'node:path';
import { jsonToDocuments, type Doc } from './from-json.ts';

export const SANITY = {
  projectId: process.env.SANITY_PROJECT_ID || '8hc671sk',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-02-19',
};

export const DOCUMENT_TYPES = ['siteSettings', 'communitySettings', 'festivalSettings', 'page', 'person'];

const QUERY = `*[_type in $types && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]`;

export type Loaded = { source: 'json' | 'sanity' | 'file'; docs: Doc[] };

export async function loadDocuments(warn: (msg: string) => void): Promise<Loaded> {
  const setting = (process.env.CONTENT_SOURCE || 'json').trim();

  if (setting === 'json' || setting === '') {
    return { source: 'json', docs: jsonToDocuments(path.join(process.cwd(), 'src', 'content'), warn) };
  }

  if (setting.startsWith('file:')) {
    const file = path.resolve(process.cwd(), setting.slice(5));
    const docs = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as Doc)
      .filter((d) => DOCUMENT_TYPES.includes(d._type) && !String(d._id).startsWith('drafts.'));
    return { source: 'file', docs };
  }

  if (setting === 'sanity') {
    const token = process.env.SANITY_READ_TOKEN?.trim();
    const host = token ? 'api' : 'apicdn';
    const url = new URL(`https://${SANITY.projectId}.${host}.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}`);
    url.searchParams.set('query', QUERY);
    url.searchParams.set('$types', JSON.stringify(DOCUMENT_TYPES));
    url.searchParams.set('perspective', 'published');
    let res: Response;
    try {
      res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (e) {
      throw new Error(`Could not reach Sanity (${url.host}): ${(e as Error).message}. The previous site stays online.`);
    }
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? ' The dataset may be private: set SANITY_READ_TOKEN in the host settings.' : '';
      throw new Error(`Sanity answered ${res.status} ${res.statusText}.${hint}`);
    }
    const body = (await res.json()) as { result?: Doc[] };
    const docs = Array.isArray(body.result) ? body.result : [];
    if (!docs.some((d) => d._type === 'festivalSettings' || d._type === 'page')) {
      throw new Error(`Sanity dataset "${SANITY.dataset}" has no published content yet. Run "npm run sanity:import" first.`);
    }
    return { source: 'sanity', docs };
  }

  throw new Error(`CONTENT_SOURCE="${setting}" is not understood. Use json, sanity or file:<path>.`);
}
