// Tracks share links (?show=…): when they're opened and how long each video
// is watched. Nothing is sent for normal portfolio visits. The server ignores
// visits from a signed-in admin, so previewing your own links doesn't count.

const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(36)).join('').slice(0, 24).padEnd(12, '0');

function send(payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }))) return;
  } catch { /* fall through */ }
  fetch('/api/track', { method: 'POST', body, keepalive: true, credentials: 'same-origin', headers: { 'content-type': 'text/plain' } }).catch(() => {});
}

const noop = { attach() {}, detach() {}, opened() {} };

export function startTracking({ show, ref }) {
  if (!show) return noop;

  let visitor;
  try {
    visitor = localStorage.getItem('sm_vid');
    if (!visitor) { visitor = rid(); localStorage.setItem('sm_vid', visitor); }
  } catch { visitor = rid(); }
  const base = { show, ref: ref || '', visit: rid(), visitor };

  send({ ...base, t: 'open', referrer: document.referrer || '' });

  const watched = {};   // slug → seconds watched in this visit
  const dirty = new Set();
  let current = null;   // { video, slug, last, sentAt, off }

  const report = slug => {
    const d = current && current.slug === slug ? current.video.duration : undefined;
    send({ ...base, t: 'watch', slug, seconds: Math.round((watched[slug] || 0) * 10) / 10, duration: Number.isFinite(d) ? d : undefined });
    dirty.delete(slug);
  };
  const flush = () => [...dirty].forEach(report);

  function attach(video, slug) {
    detach();
    if (!video) return;
    watched[slug] = watched[slug] || 0;
    const c = { video, slug, last: null, sentAt: Date.now() };
    const onTime = () => {
      const t = video.currentTime;
      if (!video.paused && !video.seeking && c.last !== null && t > c.last && t - c.last < 1.5) {
        watched[slug] += t - c.last;
        dirty.add(slug);
      }
      c.last = t;
      if (dirty.has(slug) && Date.now() - c.sentAt > 15000) { c.sentAt = Date.now(); report(slug); }
    };
    const onSeek = () => { c.last = null; };
    const onStop = () => { if (dirty.has(slug)) report(slug); };
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('seeking', onSeek);
    video.addEventListener('pause', onStop);
    video.addEventListener('ended', onStop);
    c.off = () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('seeking', onSeek);
      video.removeEventListener('pause', onStop);
      video.removeEventListener('ended', onStop);
    };
    current = c;
    // Record the open even if they close it straight away
    dirty.add(slug);
  }

  function detach() {
    if (!current) return;
    current.off();
    if (dirty.has(current.slug)) report(current.slug);
    current = null;
  }

  // YouTube embeds can't report watch time; just record that it was opened
  function opened(slug) {
    detach();
    watched[slug] = watched[slug] || 0;
    report(slug);
  }

  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  return { attach, detach, opened };
}
