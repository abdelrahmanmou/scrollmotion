// Uploads to R2 in parts, so large videos stay under the per-request size limit.
//
//   POST   ?action=create&kind=video|poster&slug=…&ext=mp4   → { key, uploadId, url }
//   PUT    ?action=part&key=…&uploadId=…&part=N   (body: bytes) → { partNumber, etag }
//   POST   ?action=complete&key=…&uploadId=…   (body: { parts }) → { url }
//   DELETE ?action=abort&key=…&uploadId=…
//   PUT    ?action=put&kind=poster&slug=…&ext=jpg   (body: bytes) → { url }   small files in one go
import { json } from '../../_lib/auth.js';

const TYPES = {
  video: { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4' },
  poster: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' },
};
const MAX_PART = 50 * 1024 * 1024;
const MAX_SINGLE = 15 * 1024 * 1024;

function newKey(kind, slug, ext) {
  if (!TYPES[kind] || !TYPES[kind][ext]) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || slug.length > 80) return null;
  const stamp = Date.now().toString(36);
  return `media/${kind === 'video' ? 'videos' : 'posters'}/${slug}-${stamp}.${ext}`;
}
const urlFor = key => `/${key}`;
const validKey = key => /^media\/(videos|posters)\/[a-z0-9-]+\.[a-z0-9]+$/.test(key || '');

export async function onRequest({ request, env }) {
  const q = new URL(request.url).searchParams;
  const action = q.get('action');
  const m = request.method;

  try {
    if (action === 'create' && m === 'POST') {
      const ext = (q.get('ext') || '').toLowerCase();
      const kind = q.get('kind');
      const key = newKey(kind, q.get('slug'), ext);
      if (!key) return json({ error: 'Unsupported file type or bad slug' }, 400);
      const up = await env.MEDIA.createMultipartUpload(key, {
        httpMetadata: { contentType: TYPES[kind][ext] },
      });
      return json({ key, uploadId: up.uploadId, url: urlFor(key) });
    }

    if (action === 'put' && m === 'PUT') {
      const ext = (q.get('ext') || '').toLowerCase();
      const kind = q.get('kind');
      const key = newKey(kind, q.get('slug'), ext);
      if (!key) return json({ error: 'Unsupported file type or bad slug' }, 400);
      const data = await request.arrayBuffer();
      if (!data.byteLength || data.byteLength > MAX_SINGLE) return json({ error: 'File is empty or too large for a single upload' }, 400);
      await env.MEDIA.put(key, data, { httpMetadata: { contentType: TYPES[kind][ext] } });
      return json({ url: urlFor(key) });
    }

    const key = q.get('key');
    const uploadId = q.get('uploadId');
    if (!validKey(key) || !uploadId) return json({ error: 'Missing upload details' }, 400);
    const up = env.MEDIA.resumeMultipartUpload(key, uploadId);

    if (action === 'part' && m === 'PUT') {
      const n = Number(q.get('part'));
      if (!Number.isInteger(n) || n < 1 || n > 10000) return json({ error: 'Bad part number' }, 400);
      const data = await request.arrayBuffer();
      if (!data.byteLength || data.byteLength > MAX_PART) return json({ error: 'Part is empty or too large' }, 400);
      const part = await up.uploadPart(n, data);
      return json(part);
    }

    if (action === 'complete' && m === 'POST') {
      const { parts } = await request.json();
      if (!Array.isArray(parts) || !parts.length) return json({ error: 'No parts' }, 400);
      await up.complete(parts.map(p => ({ partNumber: Number(p.partNumber), etag: String(p.etag) })));
      return json({ url: urlFor(key) });
    }

    if (action === 'abort' && m === 'DELETE') {
      await up.abort();
      return json({ ok: true });
    }
  } catch (e) {
    return json({ error: `Upload failed: ${e.message || e}` }, 500);
  }

  return json({ error: 'Unknown action' }, 400);
}
