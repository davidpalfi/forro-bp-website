// Test content shaped like a real Sanity dataset, for npm run check.
// Starts from the JSON content (via from-json.ts), then:
//   - turns every photo into an uploaded Sanity image, with a crop and a focus point,
//   - adds a page that uses every kind of block, and a community page,
//   - adds the mistakes an editor could make (VALID_EXCEPT lists those documents).
// Nothing here contacts Sanity.

import crypto from 'node:crypto';
import { jsonToDocuments } from '../../src/lib/from-json.ts';

/** Documents that are wrong on purpose; the schema check skips them. */
export const BROKEN_IDS = ['page-broken', 'page-dup', 'page-reserved', 'page-noslug', 'person-musician', 'drafts.page-everything'];

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex');
const ref = (_ref) => ({ _type: 'reference', _ref });
const pt = (text, markDefs = [], marks = []) => [
  { _type: 'block', _key: hash(text).slice(0, 8), style: 'normal', markDefs, children: [{ _type: 'span', _key: 's1', text, marks }] },
];

function uploaded(value, crop) {
  if (Array.isArray(value)) return value.map((v) => uploaded(v, crop));
  if (!value || typeof value !== 'object') return value;
  if (typeof value._upload === 'string') {
    const { _upload, ...rest } = value;
    return {
      ...rest,
      asset: ref(`image-${hash(_upload)}-1600x1200-${_upload.endsWith('.png') ? 'png' : 'jpg'}`),
      ...(crop ? { crop: { _type: 'sanity.imageCrop', top: 0.1, bottom: 0, left: 0.2, right: 0 }, hotspot: { _type: 'sanity.imageHotspot', x: 0.6, y: 0.5, width: 0.3, height: 0.3 } } : {}),
    };
  }
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, uploaded(v, crop)]));
}

export function makeFixture(contentDir) {
  const docs = jsonToDocuments(contentDir).map((d) => uploaded(d, d._type === 'person'));
  const img = (name, alt) => ({ _type: 'imageWithAlt', asset: ref(`image-${hash(name)}-1200x800-jpg`), ...(alt ? { alt_en: alt } : {}) });
  const style = (background = 'default', alignment = 'left') => ({ background, alignment });

  docs.push(
    {
      _id: 'page-everything',
      _type: 'page',
      title_en: 'Everything',
      title_hu: 'Minden',
      heading_en: 'Every block',
      slug: { _type: 'slug', current: 'everything' },
      section: 'festival',
      tone: 'dark',
      showInMenu: true,
      order: 5,
      coverImage: img('cover', 'Dancers on the island'),
      blocks: [
        { _type: 'headingBlock', _key: 'b01', heading_en: 'A small heading', level: 3, ...style() },
        {
          _type: 'textBlock',
          _key: 'b02',
          body_en: pt('See the program', [{ _type: 'link', _key: 'l1', href: '/festival/program/' }], ['l1']),
          body_hu: pt('Nézd meg a programot', [{ _type: 'link', _key: 'l1', href: '/festival/program/' }], ['l1']),
          look: 'normal',
          ...style(),
        },
        { _type: 'imageBlock', _key: 'b03', image: img('full', 'Full width photo'), caption_en: 'A caption', width: 'full', ...style() },
        { _type: 'galleryBlock', _key: 'b04', layout: 'mosaic', images: [{ ...img('g1'), _key: 'g1' }, { ...img('g2'), _key: 'g2' }], ...style() },
        { _type: 'buttonBlock', _key: 'b05', page: ref('page-location'), ...style('cream', 'center') },
        { _type: 'buttonBlock', _key: 'b06', label_en: 'Evil button', url: 'javascript:alert(1)', ...style('cream', 'center') },
        {
          _type: 'bannerBlock',
          _key: 'b07',
          image: img('banner'),
          title_en: 'Banner title',
          body_en: pt('Banner text'),
          label_en: 'Banner button',
          url: 'https://example.org/',
          ...style(),
        },
        {
          _type: 'columnsBlock',
          _key: 'b08',
          columns: [
            { _type: 'pageColumn', _key: 'c1', heading_en: 'Column one', body_en: pt('First') },
            { _type: 'pageColumn', _key: 'c2', heading_en: 'Column two', body_en: pt('Second'), image: img('col') },
            { _type: 'pageColumn', _key: 'c3', heading_en: 'Column three', body_en: pt('Third') },
          ],
          ...style(),
        },
        { _type: 'videoBlock', _key: 'b09', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption_en: 'A video', ...style() },
        { _type: 'videoBlock', _key: 'b10', url: 'https://example.org/video.mp4', ...style() },
        { _type: 'dividerBlock', _key: 'b11', style: 'line', ...style() },
        { _type: 'dividerBlock', _key: 'b12', style: 'space', ...style() },
        { _type: 'peopleGridBlock', _key: 'b13', group: 'all', people: [{ ...ref('person-gisa'), _key: 'p1' }, { ...ref('person-dori-czako'), _key: 'p2' }], ...style() },
        { _type: 'textBlock', _key: 'b14', body_en: pt('A statement line'), look: 'statement', ...style('red', 'center') },
      ],
    },
    {
      _id: 'page-classes',
      _type: 'page',
      title_en: 'Classes',
      title_hu: 'Órák',
      slug: { _type: 'slug', current: 'classes' },
      section: 'community',
      tone: 'cream',
      showInMenu: true,
      order: 1,
      blocks: [{ _type: 'textBlock', _key: 'x1', body_en: pt('Weekly classes text'), look: 'normal', ...style() }],
    },
    // Mistakes:
    { _id: 'drafts.page-everything', _type: 'page', title_en: 'DRAFT TITLE', slug: { _type: 'slug', current: 'everything' }, section: 'festival' },
    {
      _id: 'page-broken',
      _type: 'page',
      title_en: 'Broken',
      slug: { _type: 'slug', current: 'broken' },
      section: 'festival',
      showInMenu: false,
      blocks: [
        { _type: 'mysteryBlock', _key: 'm1' },
        { _type: 'buttonBlock', _key: 'm2', label_en: 'To nowhere', page: ref('page-nope') },
        { _type: 'textBlock', _key: 'm3', body_en: 'plain *markdown* string' },
      ],
    },
    { _id: 'page-dup', _type: 'page', title_en: 'Duplicate', slug: { _type: 'slug', current: 'location' }, section: 'festival', order: 999 },
    { _id: 'page-reserved', _type: 'page', title_en: 'Reserved', slug: { _type: 'slug', current: 'festival' }, section: 'community' },
    { _id: 'page-noslug', _type: 'page', title_en: 'No address', section: 'festival' },
    { _id: 'person-musician', _type: 'person', name: 'Mystery Musician', group: 'Musician', order: 1 },
  );
  return docs;
}
