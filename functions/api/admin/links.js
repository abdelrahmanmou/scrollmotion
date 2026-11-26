// Admin: tracked share links.
//   GET            → all links with totals
//   GET ?id=…      → one link's visits with the videos watched in each
//   PUT  { show, ref, label }   → add a link or rename it
//   DELETE ?id=…   → forget a link and its visits
import { json } from '../../_lib/auth.js';
import { ensureSchema, normShow, normRef, linkId } from '../../_lib/track.js';

function noDb() {
  return json({ error: 'Tracking database is not connected. Add the DB (D1) binding in Cloudflare Pages.' }, 503);
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return noDb();
  await ensureSchema(env.DB);
  const id = new URL(request.url).searchParams.get('id');

  if (id) {
    const link = await env.DB.prepare('SELECT * FROM links WHERE id = ?').bind(id).first();
    if (!link) return json({ error: 'Link not found' }, 404);
    const visits = (await env.DB.prepare(
      'SELECT id, visitor, started, last_seen, country, city, device, referrer FROM visits WHERE link_id = ? ORDER BY started DESC LIMIT 200',
    ).bind(id).all()).results;
    const plays = (await env.DB.prepare(
      `SELECT p.visit_id, p.slug, p.seconds, p.duration FROM plays p JOIN visits v ON v.id = p.visit_id
       WHERE v.link_id = ? ORDER BY p.updated`,
    ).bind(id).all()).results;
    const byVisit = {};
    for (const p of plays) (byVisit[p.visit_id] ||= []).push({ slug: p.slug, seconds: p.seconds, duration: p.duration });
    return json({ link, visits: visits.map(v => ({ ...v, plays: byVisit[v.id] || [] })) });
  }

  const rows = (await env.DB.prepare(`
    SELECT l.id, l.show, l.ref, l.label, l.created,
      COUNT(DISTINCT v.id) AS visits,
      COUNT(DISTINCT v.visitor) AS people,
      MIN(v.started) AS first_open,
      MAX(v.last_seen) AS last_seen,
      (SELECT COALESCE(SUM(p.seconds), 0) FROM plays p JOIN visits v2 ON v2.id = p.visit_id WHERE v2.link_id = l.id) AS watched,
      (SELECT COUNT(DISTINCT p.slug) FROM plays p JOIN visits v2 ON v2.id = p.visit_id WHERE v2.link_id = l.id AND p.seconds >= 3) AS videos_watched
    FROM links l LEFT JOIN visits v ON v.link_id = l.id
    GROUP BY l.id
    ORDER BY COALESCE(MAX(v.last_seen), l.created) DESC`).all()).results;
  return json({ links: rows });
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return noDb();
  await ensureSchema(env.DB);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const show = normShow(b.show);
  if (!show) return json({ error: 'The link has no videos' }, 400);
  const ref = normRef(b.ref);
  const id = linkId(show, ref);
  const label = String(b.label || '').trim().slice(0, 100);
  await env.DB.prepare(`INSERT INTO links (id, show, ref, label, created) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET label = CASE WHEN excluded.label <> '' OR ? THEN excluded.label ELSE links.label END`)
    .bind(id, show, ref, label, Date.now(), b.clearLabel ? 1 : 0).run();
  return json({ ok: true, id });
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return noDb();
  await ensureSchema(env.DB);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM plays WHERE visit_id IN (SELECT id FROM visits WHERE link_id = ?)').bind(id),
    env.DB.prepare('DELETE FROM visits WHERE link_id = ?').bind(id),
    env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id),
  ]);
  return json({ ok: true });
}
