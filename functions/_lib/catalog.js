// Validation for the portfolio catalogue the CMS saves to R2 (catalog.json).

export const CATALOG_KEY = 'catalog.json';
const FORMATS = new Set(['landscape', 'vertical', 'square']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Site-relative paths only, or YouTube thumbnails
const safeUrl = v => {
  const s = str(v, 400);
  if (/^\/(?!\/)[^\s"'<>\\]*$/.test(s)) return s;
  if (/^https:\/\/i\.ytimg\.com\/[^\s"'<>\\]+$/.test(s)) return s;
  return '';
};

export function cleanCatalog(input) {
  if (!input || typeof input !== 'object') throw new Error('Catalogue must be an object');

  const categories = [];
  const catIds = new Set();
  for (const c of Array.isArray(input.categories) ? input.categories : []) {
    const id = str(c && c.id, 40);
    if (!SLUG.test(id) || catIds.has(id)) throw new Error(`Bad or duplicate category id "${id}"`);
    const label = str(c.label, 60);
    if (!label) throw new Error(`Category "${id}" needs a name`);
    catIds.add(id);
    categories.push({ id, label, desc: str(c.desc, 200) });
  }
  if (!categories.length) throw new Error('At least one category is required');

  const videos = [];
  const slugs = new Set();
  for (const v of Array.isArray(input.videos) ? input.videos : []) {
    const slug = str(v && v.slug, 80);
    if (!SLUG.test(slug) || slugs.has(slug)) throw new Error(`Bad or duplicate video slug "${slug}"`);
    const title = str(v.title, 120);
    if (!title) throw new Error(`Video "${slug}" needs a title`);
    if (!catIds.has(v.category)) throw new Error(`Video "${slug}" has an unknown category`);
    const out = {
      slug,
      title,
      client: str(v.client, 80),
      category: v.category,
      format: FORMATS.has(v.format) ? v.format : 'landscape',
      blurb: str(v.blurb, 240),
      poster: safeUrl(v.poster),
    };
    if (v.youtube) {
      if (!YT_ID.test(v.youtube)) throw new Error(`Video "${slug}" has a bad YouTube id`);
      out.youtube = v.youtube;
    } else {
      out.src = safeUrl(v.src);
      if (!out.src) throw new Error(`Video "${slug}" has no video file`);
    }
    const d = Number(v.duration);
    if (Number.isFinite(d) && d > 0 && d < 36000) out.duration = Math.round(d);
    if (v.hidden === true) out.hidden = true;
    slugs.add(slug);
    videos.push(out);
  }

  const featured = (Array.isArray(input.featured) ? input.featured : [])
    .filter((s, i, a) => slugs.has(s) && a.indexOf(s) === i)
    .slice(0, 6);

  return { version: 1, updatedAt: new Date().toISOString(), categories, featured, videos };
}
