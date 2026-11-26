// /portfolio?show=… : give each share link its own preview card in WhatsApp,
// LinkedIn, iMessage, Slack, email and so on (they read the og: tags; they don't
// run JavaScript). The page itself is the normal static portfolio.html.
import { CATALOG_KEY } from './_lib/catalog.js';
import { linkMeta, normShow } from './_lib/track.js';

const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export async function onRequestGet({ request, env }) {
  const res = await env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const show = normShow(url.searchParams.get('show'));
  if (!show || !(res.headers.get('content-type') || '').includes('text/html')) return res;

  let videos = [];
  try {
    const obj = env.MEDIA && await env.MEDIA.get(CATALOG_KEY);
    if (obj) {
      const cat = await obj.json();
      const bySlug = new Map(cat.videos.map(v => [v.slug, v]));
      videos = show.split(',').map(s => bySlug.get(s)).filter(Boolean);
    }
  } catch { /* fall back to generic text */ }
  if (!videos.length) return res;

  const meta = await linkMeta(env, url.searchParams.get('show'), url.searchParams.get('ref')).catch(() => null) || {};
  const n = videos.length;
  const title = n === 1
    ? `${videos[0].title} · Abdelrahman Moustafa`
    : meta.name ? `${n} videos picked for ${meta.name}` : `${n} videos picked for you · Abdelrahman Moustafa`;
  const names = videos.slice(0, 3).map(v => v.title).join(', ') + (n > 3 ? ` and ${n - 3} more` : '');
  const description = meta.note
    ? meta.note.slice(0, 180)
    : `${names}. Selected work by Abdelrahman Moustafa, editor and motion designer.`;
  const poster = videos[0].poster || '/abdelrahman.JPG';
  const image = new URL(poster, url.origin).toString();

  const tags = [
    `<title>${attr(title)}</title>`,
    `<meta name="description" content="${attr(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Abdelrahman Moustafa">`,
    `<meta property="og:url" content="${attr(url.toString())}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:image" content="${attr(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${attr(title)}">`,
    `<meta name="twitter:description" content="${attr(description)}">`,
    `<meta name="twitter:image" content="${attr(image)}">`,
    // Private picks shouldn't show up in search results
    `<meta name="robots" content="noindex">`,
  ].join('\n  ');

  const drop = { element(e) { e.remove(); } };
  const out = new HTMLRewriter()
    .on('title', drop)
    .on('meta[name="description"]', drop)
    .on('meta[property^="og:"]', drop)
    .on('meta[name^="twitter:"]', drop)
    .on('meta[name="robots"]', drop)
    .on('head', { element(e) { e.append(`\n  ${tags}\n`, { html: true }); } })
    .transform(res);
  const headers = new Headers(out.headers);
  headers.set('cache-control', 'no-cache');
  return new Response(out.body, { status: out.status, headers });
}
