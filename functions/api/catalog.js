// Public: the portfolio catalogue the CMS manages.
// 404 means the CMS hasn't saved anything yet; the page then uses the
// built-in list in js/portfolio-data.js.
import { CATALOG_KEY } from '../_lib/catalog.js';
import { json } from '../_lib/auth.js';

export async function onRequestGet({ env }) {
  if (!env.MEDIA) return json({ error: 'Storage is not connected' }, 503);
  const obj = await env.MEDIA.get(CATALOG_KEY);
  if (!obj) return json(null, 404);
  return new Response(obj.body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      etag: obj.httpEtag,
    },
  });
}
