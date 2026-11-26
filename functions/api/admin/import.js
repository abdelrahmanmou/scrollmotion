// POST ?path=/videos/x.mp4&kind=video|poster&slug=x
// Copies a file that ships with the site (public/) into R2, server-side, and
// returns its new /media/… URL. Used by the admin's "Move to R2" tool.
import { json } from '../../_lib/auth.js';

const TYPES = {
  video: { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4' },
  poster: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' },
};

export async function onRequestPost({ request, env }) {
  const q = new URL(request.url).searchParams;
  const path = q.get('path') || '';
  const kind = q.get('kind');
  const slug = q.get('slug') || '';

  // Only plain site-relative files, never other origins or parent paths
  if (!/^\/[A-Za-z0-9 _.\/%-]+$/.test(path) || path.includes('..') || path.startsWith('//') ||
      path.startsWith('/media/') || path.startsWith('/api/')) {
    return json({ error: 'Not a site file' }, 400);
  }
  if (!TYPES[kind] || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: 'Bad kind or slug' }, 400);
  const ext = path.split('.').pop().toLowerCase();
  if (!TYPES[kind][ext]) return json({ error: `Unsupported file type .${ext}` }, 400);

  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  const type = res.headers.get('content-type') || '';
  if (!res.ok || type.includes('text/html')) return json({ error: `File not found on the site: ${path}` }, 404);

  const key = `media/${kind === 'video' ? 'videos' : 'posters'}/${slug}-${Date.now().toString(36)}.${ext === 'jpeg' ? 'jpg' : ext}`;
  const httpMetadata = { contentType: TYPES[kind][ext] };
  const len = Number(res.headers.get('content-length'));
  // Stream when the size is known (cheap on CPU); otherwise buffer
  const obj = len > 0
    ? await env.MEDIA.put(key, res.body, { httpMetadata })
    : await env.MEDIA.put(key, await res.arrayBuffer(), { httpMetadata });
  return json({ url: `/${key}`, size: obj.size });
}
