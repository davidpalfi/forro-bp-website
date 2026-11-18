// A stand-in for Sanity's query API on this computer, for npm run check: the click-to-edit
// preview (and its lock) can then be run and tested without network or a real token.
// The preview is pointed at it with SANITY_API_HOST=http://127.0.0.1:<port>.
//
// - Content queries return `docs` (published) or, with the right token and the drafts
//   perspective, `docs` with DRAFT_NAME (or state.draftName) as the festival name (an
//   unpublished change).
// - The preview lock's secret check knows exactly one Studio secret: SECRET.

import http from 'node:http';

export const TOKEN = 'test-viewer-token';
export const SECRET = 'test-studio-secret';
export const DRAFT_NAME = 'Unpublished festival name';

export function startFakeSanity(docs, port) {
  const requests = [];
  const state = { draftName: DRAFT_NAME };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const query = url.searchParams.get('query') || '';
    const authorized = req.headers.authorization === `Bearer ${TOKEN}`;
    const perspective = url.searchParams.get('perspective') || 'raw';
    requests.push({ path: url.pathname, perspective, authorized, secretCheck: query.includes('sanity.previewUrlSecret') });
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (!/^\/v[\d-]+\/data\/query\/production$/.test(url.pathname)) return send(404, { error: 'not found' });
    if (req.headers.authorization && !authorized) return send(401, { error: 'Unauthorized', message: 'bad token' });

    if (query.includes('sanity.previewUrlSecret')) {
      // Secrets are not public: without the token Sanity would return nothing.
      const given = JSON.parse(url.searchParams.get('$secret') || '""');
      const ok = authorized && given === SECRET;
      return send(200, {
        result: {
          private: ok ? { _id: 'sanity-preview-url-secret.test', _updatedAt: new Date().toISOString(), secret: SECRET, studioUrl: 'https://forro-budapest.sanity.studio' } : null,
          public: null,
        },
      });
    }
    const drafts = authorized && perspective === 'drafts';
    const result = docs.map((d) => (drafts && d._id === 'festivalSettings' ? { ...d, name: state.draftName } : d));
    return send(200, { result });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, requests, state, close: () => new Promise((r) => server.close(r)) })));
}
