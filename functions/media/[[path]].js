// Public: streams files the CMS uploaded to R2 (videos and thumbnails).
// Supports Range requests, which Safari and iOS need to play video.

export async function onRequest({ request, env, params }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  if (!env.MEDIA) return new Response('Storage is not connected', { status: 503 });

  const path = [].concat(params.path || []).join('/');
  if (!path || path.includes('..')) return new Response('Not found', { status: 404 });
  const key = `media/${path}`;

  const headers = new Headers({
    'accept-ranges': 'bytes',
    // Keys are unique per upload, so a file never changes under the same URL
    'cache-control': 'public, max-age=31536000, immutable',
  });

  if (request.method === 'HEAD') {
    const head = await env.MEDIA.head(key);
    if (!head) return new Response(null, { status: 404 });
    head.writeHttpMetadata(headers);
    headers.set('etag', head.httpEtag);
    headers.set('content-length', String(head.size));
    return new Response(null, { headers });
  }

  let obj;
  try {
    obj = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers });
  } catch {
    const head = await env.MEDIA.head(key);
    if (!head) return new Response('Not found', { status: 404 });
    return new Response('Range not satisfiable', {
      status: 416, headers: { 'content-range': `bytes */${head.size}` },
    });
  }
  if (!obj) return new Response('Not found', { status: 404 });

  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  if (!('body' in obj)) return new Response(null, { status: 304, headers });

  const size = obj.size;
  if (request.headers.has('range') && obj.range) {
    let { offset, length, suffix } = obj.range;
    if (suffix !== undefined) { offset = Math.max(0, size - suffix); length = size - offset; }
    offset = offset || 0;
    if (length === undefined) length = size - offset;
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${size}`);
    headers.set('content-length', String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('content-length', String(size));
  return new Response(obj.body, { headers });
}
