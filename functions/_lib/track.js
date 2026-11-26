// Share-link tracking, stored in the D1 database bound as DB.
//
// A link is identified by its ?show= list (normalised) plus an optional ?ref=
// tag, so a link sent before tracking existed is still recognised.

let ready = false;
export async function ensureSchema(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY, show TEXT NOT NULL, ref TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY, link_id TEXT NOT NULL, visitor TEXT NOT NULL,
      started INTEGER NOT NULL, last_seen INTEGER NOT NULL,
      country TEXT, city TEXT, device TEXT, referrer TEXT)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS visits_link ON visits(link_id, started)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS plays (
      visit_id TEXT NOT NULL, slug TEXT NOT NULL, seconds REAL NOT NULL DEFAULT 0,
      duration REAL, updated INTEGER NOT NULL, PRIMARY KEY (visit_id, slug))`),
    db.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
  ]);
  // Columns added after the first release
  const cols = (await db.prepare('PRAGMA table_info(links)').all()).results.map(c => c.name);
  if (!cols.includes('greet')) await db.prepare('ALTER TABLE links ADD COLUMN greet INTEGER NOT NULL DEFAULT 1').run();
  if (!cols.includes('note')) await db.prepare("ALTER TABLE links ADD COLUMN note TEXT NOT NULL DEFAULT ''").run();
  ready = true;
}

// Public details for a link page: who it's for and your note (only if greeting is on)
export async function linkMeta(env, rawShow, rawRef) {
  if (!env.DB) return null;
  const show = normShow(rawShow);
  if (!show) return null;
  await ensureSchema(env.DB);
  const ref = normRef(rawRef);
  let row = await env.DB.prepare('SELECT label, greet, note FROM links WHERE id = ?').bind(linkId(show, ref)).first();
  // A ref typed by hand that was never registered: fall back to the plain link
  if (!row && ref) row = await env.DB.prepare('SELECT label, greet, note FROM links WHERE id = ?').bind(linkId(show, '')).first();
  if (!row) return { name: '', note: '' };
  return { name: row.greet ? row.label : '', note: row.note || '' };
}

export async function getSetting(db, key) {
  const r = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return r ? r.value : null;
}
export async function setSetting(db, key, value) {
  if (value === null) return db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
  return db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, value).run();
}

export function countryName(code) {
  if (!code) return '';
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; }
}

// "Goldsand, hub-xyz" → "goldsand,hub-xyz"
export function normShow(raw) {
  const seen = new Set();
  return String(raw || '').split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && !seen.has(s) && seen.add(s))
    .join(',')
    .slice(0, 1200);
}

export function normRef(raw) {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export const linkId = (show, ref) => `${show}|${ref || ''}`;

export function deviceOf(ua = '') {
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android phone' : 'Android tablet')
    : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  // In-app browsers say where the link was opened from
  const app = /WhatsApp/i.test(ua) ? 'WhatsApp' : /Instagram/.test(ua) ? 'Instagram' : /FBAN|FBAV/.test(ua) ? 'Facebook'
    : /LinkedInApp/.test(ua) ? 'LinkedIn' : /Twitter/i.test(ua) ? 'X' : '';
  return [os, app ? `${app} app` : browser].filter(Boolean).join(' · ');
}
