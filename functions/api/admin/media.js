// DELETE ?url=/media/… removes a file the CMS uploaded.
// Files that ship with the site (in public/) aren't in R2 and are left alone.
import { json } from '../../_lib/auth.js';

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url).searchParams.get('url') || '';
  const m = url.match(/^\/(media\/(?:videos|posters)\/[a-z0-9-]+\.[a-z0-9]+)$/);
  if (!m) return json({ ok: true, skipped: true });
  await env.MEDIA.delete(m[1]);
  return json({ ok: true });
}
