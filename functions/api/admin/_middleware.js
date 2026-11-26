// Everything under /api/admin needs a signed-in session, except login.
import { isAuthed, json } from '../../_lib/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.MEDIA) return json({ error: 'Storage is not connected. Add the MEDIA R2 binding in Cloudflare Pages.' }, 503);
  if (!env.ADMIN_PASSWORD) return json({ error: 'No admin password yet. Add an ADMIN_PASSWORD secret in Cloudflare Pages, then redeploy.', setup: true }, 503);

  // Refuse writes coming from other sites
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return json({ error: 'Cross-site request refused' }, 403);
  }

  if (url.pathname === '/api/admin/login') return context.next();
  if (!(await isAuthed(request, env))) return json({ error: 'Not signed in' }, 401);
  return context.next();
}
