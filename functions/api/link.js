// Public: who a share link is for and the note on it, for the greeting at the
// top of the page. Only returns the name when "greet by name" is on.
import { json } from '../_lib/auth.js';
import { linkMeta } from '../_lib/track.js';

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const meta = await linkMeta(env, q.get('show'), q.get('ref')).catch(() => null);
  return json(meta || { name: '', note: '' });
}
