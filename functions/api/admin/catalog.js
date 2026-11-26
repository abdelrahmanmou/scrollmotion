import { CATALOG_KEY, cleanCatalog } from '../../_lib/catalog.js';
import { json } from '../../_lib/auth.js';

const HISTORY_KEEP = 40;

export async function onRequestGet({ env }) {
  const obj = await env.MEDIA.get(CATALOG_KEY);
  if (!obj) return json({ catalog: null, etag: null });
  return json({ catalog: await obj.json(), etag: obj.etag });
}

// Body: { catalog, etag } — etag is the version the editor started from, so
// two open tabs can't silently overwrite each other.
export async function onRequestPut({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  let catalog;
  try { catalog = cleanCatalog(body.catalog); } catch (e) { return json({ error: e.message }, 400); }

  const current = await env.MEDIA.head(CATALOG_KEY);
  if (current && body.etag !== current.etag) {
    return json({ error: 'The portfolio was changed somewhere else (another tab?). Reload to get the latest version.', conflict: true }, 409);
  }

  const text = JSON.stringify(catalog);
  // Keep earlier versions so a bad edit can be rolled back
  if (current) {
    const prev = await env.MEDIA.get(CATALOG_KEY);
    if (prev) await env.MEDIA.put(`catalog-history/${Date.now()}.json`, await prev.text(), {
      httpMetadata: { contentType: 'application/json' },
    });
    const old = await env.MEDIA.list({ prefix: 'catalog-history/', limit: 1000 });
    const extra = old.objects.map(o => o.key).sort().slice(0, -HISTORY_KEEP);
    if (extra.length) await env.MEDIA.delete(extra);
  }
  const saved = await env.MEDIA.put(CATALOG_KEY, text, {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
  return json({ ok: true, etag: saved.etag, catalog });
}
