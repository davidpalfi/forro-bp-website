// /preview/enable/: the preview lock's entrance (src/lib/preview-lock.ts). Added only to the
// click-to-edit preview by astro.config.mjs; it is not a page and never part of a public build.
import type { APIRoute } from 'astro';
import { enablePreview } from '../lib/preview-lock';

export const prerender = false;
export const GET: APIRoute = ({ request }) => enablePreview(request);
