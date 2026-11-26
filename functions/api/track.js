// Public: records opens and watch time for share links (?show=…).
// Body: { t: 'open' | 'watch', show, ref, visit, visitor, referrer?, slug?, seconds?, duration? }
// Visits from a signed-in admin (you) are ignored.
import { isAuthed, json } from '../_lib/auth.js';
import { ensureSchema, normShow, normRef, linkId, deviceOf } from '../_lib/track.js';

const ID = /^[A-Za-z0-9]{8,40}$/;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false }, 503);
  if (await isAuthed(request, env)) return json({ ok: true, skipped: 'admin' });

  let b;
  try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad body' }, 400); }
  const show = normShow(b.show);
  const ref = normRef(b.ref);
  if (!show || !ID.test(b.visit || '') || !ID.test(b.visitor || '')) return json({ error: 'bad data' }, 400);

  await ensureSchema(env.DB);
  const now = Date.now();
  const id = linkId(show, ref);
  const cf = request.cf || {};

  if (b.t === 'open') {
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO links (id, show, ref, label, created) VALUES (?, ?, ?, \'\', ?)').bind(id, show, ref, now),
      env.DB.prepare(`INSERT INTO visits (id, link_id, visitor, started, last_seen, country, city, device, referrer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen`)
        .bind(b.visit, id, b.visitor, now, now, cf.country || '', cf.city || '',
          deviceOf(request.headers.get('user-agent') || ''), String(b.referrer || '').slice(0, 200)),
    ]);
    return json({ ok: true });
  }

  if (b.t === 'watch') {
    const slug = normShow(b.slug);
    const secs = Math.max(0, Math.min(Number(b.seconds) || 0, 36000));
    const dur = Number(b.duration) > 0 ? Math.min(Number(b.duration), 36000) : null;
    if (!slug || slug.includes(',')) return json({ error: 'bad slug' }, 400);
    // Only for visits that were opened, so stray requests can't create data
    const visit = await env.DB.prepare('SELECT id FROM visits WHERE id = ? AND link_id = ?').bind(b.visit, id).first();
    if (!visit) return json({ ok: false, error: 'unknown visit' }, 404);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO plays (visit_id, slug, seconds, duration, updated) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(visit_id, slug) DO UPDATE SET seconds = MAX(plays.seconds, excluded.seconds),
        duration = COALESCE(excluded.duration, plays.duration), updated = excluded.updated`)
        .bind(b.visit, slug, secs, dur, now),
      env.DB.prepare('UPDATE visits SET last_seen = ? WHERE id = ?').bind(now, b.visit),
    ]);
    return json({ ok: true });
  }

  return json({ error: 'unknown event' }, 400);
}
