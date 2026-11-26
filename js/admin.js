// Portfolio CMS (/admin)
//
// Saves the video list to /api/admin/catalog (stored in Cloudflare R2) and
// uploads video files and thumbnails to R2 through /api/admin/upload.
// Every change is published straight away; there is no separate draft.
import { BUILT_IN } from './portfolio-catalog.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const fmtTime = s => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '');
const fmtSize = b => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`);
const shareLink = (slugs, ref) => `${location.origin}/portfolio?show=${[].concat(slugs).join(',')}${ref ? `&ref=${ref}` : ''}`;

const PART_SIZE = 10 * 1024 * 1024;
const MAX_FEATURED = 3;

// ---------- State ----------
let catalog = null;   // { categories, featured, videos }
let etag = null;      // version on the server we last saw
let fromBuiltIn = false;
let saving = false;
let saveAgain = false;
let saveTimer = null;
let busyUploading = false;
let filterCat = 'all';
let query = '';
// Videos picked for a share link, in order (kept in this browser only)
let picks = [];
try { picks = JSON.parse(localStorage.getItem('cms-share-picks') || '[]').filter(s => typeof s === 'string'); } catch { /* ignore */ }

// ---------- API ----------
class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data; }
}

async function api(path, { method = 'GET', body, raw } = {}) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (raw !== undefined) opts.body = raw;
  else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['content-type'] = 'application/json'; }
  const res = await fetch(path, opts);
  let data = null;
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/admin/login') showLogin();
    throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// Upload one part with progress (fetch can't report upload progress)
function xhrPut(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data && data.error) || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.send(blob);
  });
}

async function uploadVideo(file, slug, onProgress) {
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const q = new URLSearchParams({ action: 'create', kind: 'video', slug, ext });
  const { key, uploadId, url } = await api(`/api/admin/upload?${q}`, { method: 'POST' });
  const parts = [];
  const total = file.size;
  let done = 0;
  try {
    for (let n = 1, start = 0; start < total; n++, start += PART_SIZE) {
      const chunk = file.slice(start, Math.min(start + PART_SIZE, total));
      const pq = new URLSearchParams({ action: 'part', key, uploadId, part: String(n) });
      let part;
      for (let attempt = 1; ; attempt++) {
        try {
          part = await xhrPut(`/api/admin/upload?${pq}`, chunk, loaded => onProgress((done + loaded) / total));
          break;
        } catch (e) {
          if (attempt >= 3) throw e;
          await new Promise(r => setTimeout(r, 1500 * attempt));
        }
      }
      parts.push({ partNumber: part.partNumber, etag: part.etag });
      done += chunk.size;
      onProgress(done / total);
    }
    const cq = new URLSearchParams({ action: 'complete', key, uploadId });
    await api(`/api/admin/upload?${cq}`, { method: 'POST', body: { parts } });
    return url;
  } catch (e) {
    const aq = new URLSearchParams({ action: 'abort', key, uploadId });
    api(`/api/admin/upload?${aq}`, { method: 'DELETE' }).catch(() => {});
    throw e;
  }
}

async function uploadPoster(blob, slug) {
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const q = new URLSearchParams({ action: 'put', kind: 'poster', slug, ext });
  const { url } = await api(`/api/admin/upload?${q}`, { method: 'PUT', raw: blob });
  return url;
}

const deleteMedia = url => (url && url.startsWith('/media/')
  ? api(`/api/admin/media?url=${encodeURIComponent(url)}`, { method: 'DELETE' }).catch(() => {})
  : Promise.resolve());

// ---------- Saving ----------
function setStatus(state, text) {
  const el = $('save-status');
  el.dataset.state = state;
  el.textContent = text;
}

function queueSave(delay = 700) {
  setStatus('pending', 'Unsaved changes…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, delay);
}

async function saveNow() {
  clearTimeout(saveTimer);
  if (saving) { saveAgain = true; return saveWait(); }
  saving = true;
  setStatus('saving', 'Publishing…');
  try {
    const res = await api('/api/admin/catalog', { method: 'PUT', body: { catalog, etag } });
    etag = res.etag;
    if (fromBuiltIn) { fromBuiltIn = false; renderBanner(); }
    setStatus('saved', 'All changes live');
  } catch (e) {
    setStatus('error', e.data && e.data.conflict ? 'Changed elsewhere — reload' : 'Not saved');
    toast(e.message, true);
    throw e;
  } finally {
    saving = false;
  }
  if (saveAgain) { saveAgain = false; return saveNow(); }
}
function saveWait() {
  return new Promise(resolve => {
    const t = setInterval(() => { if (!saving) { clearInterval(t); resolve(); } }, 100);
  });
}

window.addEventListener('beforeunload', e => {
  if (busyUploading || saving || $('save-status').dataset.state === 'pending') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---------- Helpers ----------
let toastTimer;
function toast(msg, isError = false) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('is-error', isError);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), isError ? 6000 : 2400);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copied'); } catch { prompt('Copy this link:', text); }
}

const catById = id => catalog.categories.find(c => c.id === id);
const bySlug = slug => catalog.videos.find(v => v.slug === slug);

function uniqueSlug(base, ignore) {
  let s = slugify(base) || 'video';
  const taken = new Set(catalog.videos.map(v => v.slug).filter(x => x !== ignore));
  if (!taken.has(s)) return s;
  for (let i = 2; ; i++) if (!taken.has(`${s}-${i}`)) return `${s}-${i}`;
}

// ---------- Screens ----------
function showOnly(id) {
  ['login', 'setup', 'app'].forEach(x => { $(x).hidden = x !== id; });
}
function showLogin() {
  showOnly('login');
  $('login-password').focus();
}

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('login-error').hidden = true;
  const btn = e.submitter || e.target.querySelector('button');
  btn.disabled = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: $('login-password').value } });
    $('login-password').value = '';
    await start();
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').hidden = false;
  } finally {
    btn.disabled = false;
  }
});

$('logout').addEventListener('click', async () => {
  await api('/api/admin/login', { method: 'DELETE' }).catch(() => {});
  showLogin();
});

async function start() {
  try {
    await api('/api/admin/session');
  } catch (e) {
    if (e.status === 503) {
      $('setup-msg').textContent = e.message;
      showOnly('setup');
    } else if (e.status === 404) {
      $('setup-msg').textContent = 'The CMS server code isn’t running here. Open this page on the live site (scrollmotions.pages.dev/admin).';
      showOnly('setup');
    } else if (e.status !== 401) {
      $('setup-msg').textContent = e.message;
      showOnly('setup');
    }
    return;
  }
  const res = await api('/api/admin/catalog');
  if (res.catalog) {
    catalog = res.catalog;
    etag = res.etag;
    fromBuiltIn = false;
  } else {
    // First run: start from the list that ships with the site
    catalog = JSON.parse(JSON.stringify(BUILT_IN));
    etag = null;
    fromBuiltIn = true;
  }
  showOnly('app');
  renderAll();
}

function renderBanner() {
  const b = $('banner');
  b.hidden = !fromBuiltIn;
  if (fromBuiltIn) {
    b.innerHTML = 'Your videos are still coming from the list built into the site. Your first change here moves them into the CMS. <button type="button" class="cms-link" id="adopt">Do it now</button>';
    $('adopt').onclick = () => saveNow().then(() => toast('The CMS now manages your portfolio')).catch(() => {});
  }
}

// ---------- Move site files to R2 ----------
// Videos and thumbnails that still ship inside the website code (not in R2)
const isSiteFile = u => typeof u === 'string' && u.startsWith('/') && !u.startsWith('/media/');
function siteFiles() {
  const out = [];
  for (const v of catalog.videos) {
    if (!v.youtube && isSiteFile(v.src)) out.push({ v, field: 'src', kind: 'video' });
    if (isSiteFile(v.poster)) out.push({ v, field: 'poster', kind: 'poster' });
  }
  return out;
}
let moving = false;

function renderStorage() {
  const box = $('storage');
  if (moving) return;
  const files = siteFiles();
  box.hidden = !files.length;
  if (!files.length) return;
  const vids = files.filter(f => f.kind === 'video').length;
  box.innerHTML = `${vids} video${vids === 1 ? '' : 's'} and ${files.length - vids} thumbnail${files.length - vids === 1 ? '' : 's'} are still stored in the website code. Moving them to R2 lets them stream on iPhones and keeps the site small. <button type="button" class="cms-link" id="move-r2">Move to R2</button>`;
  $('move-r2').onclick = moveToR2;
}

async function moveToR2() {
  const files = siteFiles();
  if (!files.length || moving) return;
  moving = true;
  busyUploading = true;
  const box = $('storage');
  const failed = [];
  let done = 0;
  try {
    for (const f of files) {
      box.textContent = `Moving to R2… ${done + 1} of ${files.length}: ${f.v.title} (${f.kind}). Keep this tab open.`;
      const q = new URLSearchParams({ path: decodeURI(f.v[f.field]), kind: f.kind, slug: f.v.slug });
      try {
        const { url } = await api(`/api/admin/import?${q}`, { method: 'POST' });
        f.v[f.field] = url;
      } catch (e) {
        failed.push(`${f.v.title} (${f.kind}): ${e.message}`);
      }
      done++;
      // Save along the way so a closed tab doesn't lose finished copies
      if (done % 10 === 0) await saveNow();
    }
    await saveNow();
  } finally {
    moving = false;
    busyUploading = false;
  }
  renderAll();
  if (failed.length) {
    box.hidden = false;
    box.innerHTML = `Moved ${files.length - failed.length} of ${files.length} files. These didn't move:<br>${failed.map(esc).join('<br>')}<br><button type="button" class="cms-link" id="move-r2">Try again</button>`;
    $('move-r2').onclick = moveToR2;
  } else {
    box.hidden = true;
    box.textContent = '';
    toast(`Moved ${files.length} files to R2`);
  }
}

// ---------- Tabs ----------
document.querySelectorAll('.cms-tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.cms-tab').forEach(x => x.classList.toggle('is-active', x === t));
  ['videos', 'categories', 'links'].forEach(n => { $(`tab-${n}`).hidden = t.dataset.tab !== n; });
  if (t.dataset.tab === 'links') { loadLinks(); loadAlerts(); }
}));

// ---------- Render ----------
function renderAll() {
  renderBanner();
  renderStorage();
  renderShare();
  renderFeatured();
  renderFilters();
  renderVideos();
  renderCategories();
}

function renderFeatured() {
  const list = $('featured-list');
  catalog.featured = catalog.featured.filter(s => bySlug(s));
  list.innerHTML = catalog.featured.length
    ? catalog.featured.map((s, i) => {
      const v = bySlug(s);
      return `<li data-slug="${esc(s)}">
        <img src="${esc(v.poster)}" alt="">
        <span>${i === 0 ? '<em>Big card</em>' : ''}${esc(v.title)}</span>
        <span class="cms-row-actions">
          <button type="button" data-act="feat-left" ${i === 0 ? 'disabled' : ''} aria-label="Move earlier">←</button>
          <button type="button" data-act="feat-right" ${i === catalog.featured.length - 1 ? 'disabled' : ''} aria-label="Move later">→</button>
          <button type="button" data-act="feat-remove" aria-label="Remove from Start here">×</button>
        </span>
      </li>`;
    }).join('')
    : '<li class="cms-muted cms-empty">Nothing starred yet.</li>';
}

$('featured-list').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const slug = b.closest('li').dataset.slug;
  const f = catalog.featured;
  const i = f.indexOf(slug);
  if (b.dataset.act === 'feat-remove') f.splice(i, 1);
  if (b.dataset.act === 'feat-left' && i > 0) [f[i - 1], f[i]] = [f[i], f[i - 1]];
  if (b.dataset.act === 'feat-right' && i < f.length - 1) [f[i + 1], f[i]] = [f[i], f[i + 1]];
  renderFeatured();
  renderVideos();
  queueSave();
});

function renderFilters() {
  const counts = id => catalog.videos.filter(v => v.category === id).length;
  $('video-count').textContent = catalog.videos.length;
  if (filterCat !== 'all' && !catById(filterCat)) filterCat = 'all';
  $('cat-filter').innerHTML = [{ id: 'all', label: 'All', n: catalog.videos.length }]
    .concat(catalog.categories.map(c => ({ id: c.id, label: c.label, n: counts(c.id) })))
    .map(c => `<button type="button" class="cms-chip${c.id === filterCat ? ' is-active' : ''}" data-cat="${esc(c.id)}">${esc(c.label)} <span>${c.n}</span></button>`)
    .join('');
}

$('cat-filter').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  filterCat = b.dataset.cat;
  renderFilters();
  renderVideos();
});
$('search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); renderVideos(); });

function renderVideos() {
  const match = v => !query || `${v.title} ${v.client} ${v.blurb}`.toLowerCase().includes(query);
  const cats = catalog.categories.filter(c => filterCat === 'all' || c.id === filterCat);
  $('video-list').innerHTML = cats.map(c => {
    const all = catalog.videos.filter(v => v.category === c.id);
    const shown = all.filter(match);
    if (!shown.length && (query || filterCat === 'all')) return '';
    return `<section class="cms-group">
      <h3>${esc(c.label)} <span class="cms-muted">${all.length}</span></h3>
      ${shown.length ? shown.map(v => {
        const i = all.indexOf(v);
        const star = catalog.featured.includes(v.slug);
        return `<div class="cms-row${v.hidden ? ' is-hidden' : ''}" data-slug="${esc(v.slug)}">
          <img class="cms-thumb cms-thumb-${esc(v.format)}" src="${esc(v.poster)}" alt="" loading="lazy">
          <div class="cms-row-main">
            <strong>${esc(v.title)}</strong>
            <span class="cms-muted">${esc([v.client, v.youtube ? 'YouTube' : v.format, fmtTime(v.duration)].filter(Boolean).join(' · '))}</span>
            ${v.hidden ? '<span class="cms-tag">Hidden · only via share links</span>' : ''}
          </div>
          <div class="cms-row-actions">
            <button type="button" data-act="up" ${i === 0 ? 'disabled' : ''} title="Move up" aria-label="Move up">↑</button>
            <button type="button" data-act="down" ${i === all.length - 1 ? 'disabled' : ''} title="Move down" aria-label="Move down">↓</button>
            <button type="button" data-act="star" class="${star ? 'is-on' : ''}" title="${star ? 'Remove from Start here' : 'Show in Start here'}" aria-pressed="${star}">★</button>
            <button type="button" data-act="hide" title="${v.hidden ? 'Show on the portfolio' : 'Hide from the portfolio (still opens from share links)'}">${v.hidden ? 'Show' : 'Hide'}</button>
            <button type="button" data-act="pick" class="${picks.includes(v.slug) ? 'is-on' : ''}" title="Add to a share link" aria-pressed="${picks.includes(v.slug)}">${picks.includes(v.slug) ? `Share ${picks.indexOf(v.slug) + 1}` : '+ Share'}</button>
            <button type="button" data-act="edit">Edit</button>
            <button type="button" data-act="delete" class="cms-danger" title="Delete">Delete</button>
          </div>
        </div>`;
      }).join('') : '<p class="cms-muted cms-empty">No videos in this category yet.</p>'}
    </section>`;
  }).join('') || '<p class="cms-muted cms-empty">No videos match.</p>';
}

$('video-list').addEventListener('click', async e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const slug = b.closest('.cms-row').dataset.slug;
  const v = bySlug(slug);
  const act = b.dataset.act;

  if (act === 'up' || act === 'down') {
    const same = catalog.videos.filter(x => x.category === v.category);
    const j = same.indexOf(v) + (act === 'up' ? -1 : 1);
    const other = same[j];
    if (!other) return;
    const a = catalog.videos.indexOf(v);
    const c = catalog.videos.indexOf(other);
    [catalog.videos[a], catalog.videos[c]] = [catalog.videos[c], catalog.videos[a]];
    renderVideos();
    queueSave();
  } else if (act === 'star') {
    toggleFeatured(slug, !catalog.featured.includes(slug));
    renderFeatured();
    renderVideos();
    queueSave();
  } else if (act === 'hide') {
    if (v.hidden) delete v.hidden; else v.hidden = true;
    renderVideos();
    queueSave();
  } else if (act === 'pick') {
    const i = picks.indexOf(slug);
    if (i >= 0) picks.splice(i, 1); else picks.push(slug);
    renderShare();
    renderVideos();
  } else if (act === 'edit') {
    openEditor(v);
  } else if (act === 'delete') {
    if (!confirm(`Delete “${v.title}”?\n\nIt disappears from the portfolio and links to it stop showing it.${v.src && v.src.startsWith('/media/') ? ' The uploaded file is deleted too.' : ''}`)) return;
    catalog.videos.splice(catalog.videos.indexOf(v), 1);
    catalog.featured = catalog.featured.filter(s => s !== slug);
    picks = picks.filter(s => s !== slug);
    renderAll();
    try {
      await saveNow();
      deleteMedia(v.src);
      deleteMedia(v.poster);
      toast('Deleted');
    } catch { /* toast already shown */ }
  }
});

function toggleFeatured(slug, on) {
  const f = catalog.featured;
  const i = f.indexOf(slug);
  if (on && i < 0) {
    if (f.length >= MAX_FEATURED) { toast(`“Start here” holds ${MAX_FEATURED}. Remove one first.`, true); return false; }
    f.push(slug);
  } else if (!on && i >= 0) f.splice(i, 1);
  return true;
}

// ---------- Share-link builder ----------
function renderShare() {
  picks = picks.filter(s => bySlug(s));
  try { localStorage.setItem('cms-share-picks', JSON.stringify(picks)); } catch { /* ignore */ }
  $('share-bar').hidden = !picks.length;
  document.body.classList.toggle('has-sharebar', picks.length > 0);
  if (!picks.length) return;
  const url = shareLink(picks, slugify($('share-name').value));
  $('share-count').textContent = `Share link · ${picks.length} video${picks.length > 1 ? 's' : ''} shown first, in this order`;
  $('share-list').innerHTML = picks.map((s, i) => {
    const v = bySlug(s);
    return `<li data-slug="${esc(s)}"><span>${i + 1}</span>${esc(v.title)}${v.hidden ? ' <em>(hidden)</em>' : ''}
      <button type="button" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move earlier">←</button>
      <button type="button" data-move="1" ${i === picks.length - 1 ? 'disabled' : ''} aria-label="Move later">→</button>
      <button type="button" data-remove aria-label="Remove">×</button></li>`;
  }).join('');
  $('share-url').value = url;
  $('share-open').href = url;
}

$('share-list').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const s = b.closest('li').dataset.slug;
  const i = picks.indexOf(s);
  if (b.hasAttribute('data-remove')) picks.splice(i, 1);
  else {
    const j = i + Number(b.dataset.move);
    if (j >= 0 && j < picks.length) [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  renderShare();
  renderVideos();
});
$('share-clear').addEventListener('click', () => { picks = []; $('share-name').value = ''; $('share-note').value = ''; renderShare(); renderVideos(); });
$('share-name').addEventListener('input', renderShare);
$('share-copy').addEventListener('click', async () => {
  const name = $('share-name').value.trim();
  const note = $('share-note').value.trim();
  const ref = slugify(name);
  copy(shareLink(picks, ref));
  // Register it so it shows (with its name) in the Links tab before it's opened
  const body = { show: picks.join(','), ref };
  if (name) body.label = name;
  if (note) body.note = note;
  api('/api/admin/links', { method: 'PUT', body })
    .catch(e => toast(`Link copied, but tracking couldn't save its name: ${e.message}`, true));
});
$('share-url').addEventListener('focus', e => e.target.select());

// ---------- Tracked links ----------
const fmtWatch = s => { s = Math.round(s || 0); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} day${d > 1 ? 's' : ''} ago` : new Date(ms).toLocaleDateString();
}
const when = ms => new Date(ms).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
let regionNames = null;
try { regionNames = new Intl.DisplayNames(undefined, { type: 'region' }); } catch { /* old browser */ }
const place = v => [v.city, v.country ? (regionNames ? regionNames.of(v.country) : v.country) : ''].filter(Boolean).join(', ') || 'Unknown place';
const titleOf = slug => (bySlug(slug) || {}).title || slug;

let linksCache = [];
async function loadLinks() {
  const box = $('links-list');
  box.innerHTML = '<p class="cms-muted cms-empty">Loading…</p>';
  try {
    const { links } = await api('/api/admin/links');
    linksCache = links;
    renderLinks();
  } catch (e) {
    box.innerHTML = `<p class="cms-error">${esc(e.message)}</p>`;
  }
}

function renderLinks() {
  const box = $('links-list');
  if (!linksCache.length) {
    box.innerHTML = '<p class="cms-muted cms-empty">No tracked links yet. Pick videos with “+ Share” and copy a link, or paste one you already sent above.</p>';
    return;
  }
  box.innerHTML = linksCache.map(l => {
    const slugs = l.show.split(',');
    const stats = l.visits
      ? `<strong class="cms-opened">Opened ${l.visits}×</strong>${l.people > 1 ? ` by ${l.people} people` : ''} · last seen ${ago(l.last_seen)} · ${l.videos_watched ? `watched ${fmtWatch(l.watched)} across ${l.videos_watched} video${l.videos_watched > 1 ? 's' : ''}` : 'no videos played yet'}`
      : '<span class="cms-muted">Not opened yet</span>';
    const reached = [l.whatsapp ? '<span class="cms-reached">💬 Tapped WhatsApp</span>' : '', l.calls ? '<span class="cms-reached">📅 Opened booking page</span>' : ''].filter(Boolean).join(' ');
    return `<div class="cms-linkrow" data-id="${esc(l.id)}">
      <div class="cms-linkrow-main">
        <div class="cms-linkrow-title"><strong>${esc(l.label || 'Unnamed link')}</strong>${l.ref ? ` <span class="cms-tag">ref: ${esc(l.ref)}</span>` : ''}${l.label && !l.greet ? ' <span class="cms-tag">name hidden on page</span>' : ''}</div>
        ${l.note ? `<div class="cms-muted cms-small">Note: “${esc(l.note.length > 90 ? `${l.note.slice(0, 90)}…` : l.note)}”</div>` : ''}
        <div class="cms-small">${stats}${reached ? ` · ${reached}` : ''}</div>
        <div class="cms-muted cms-small cms-linkrow-videos">${slugs.length} video${slugs.length > 1 ? 's' : ''}: ${slugs.slice(0, 4).map(s => esc(titleOf(s))).join(', ')}${slugs.length > 4 ? '…' : ''}</div>
      </div>
      <div class="cms-row-actions">
        ${l.visits ? '<button type="button" data-act="details">Details</button>' : ''}
        <button type="button" data-act="edit">Edit</button>
        <button type="button" data-act="copy">Copy</button>
        <button type="button" data-act="delete" class="cms-danger">Delete</button>
      </div>
      <form class="cms-linkrow-edit" hidden>
        <label class="cms-field"><span>Client name (also shown on the page as “For …”)</span><input name="label" maxlength="100" value="${esc(l.label)}"></label>
        <label class="cms-check"><input type="checkbox" name="greet" ${l.greet ? 'checked' : ''}> Show their name on the page</label>
        <label class="cms-field"><span>Note to them (shown above the videos)</span><textarea name="note" maxlength="500" rows="3">${esc(l.note)}</textarea></label>
        <div class="cms-edit-btns"><button type="button" class="cms-btn cms-btn-ghost" data-act="edit-cancel">Cancel</button><button type="submit" class="cms-btn cms-btn-primary">Save</button></div>
      </form>
      <div class="cms-linkrow-details" hidden></div>
    </div>`;
  }).join('');
}

$('links-refresh').addEventListener('click', loadLinks);

$('links-list').addEventListener('submit', async e => {
  const f = e.target.closest('.cms-linkrow-edit');
  if (!f) return;
  e.preventDefault();
  const l = linksCache.find(x => x.id === f.closest('.cms-linkrow').dataset.id);
  try {
    await api('/api/admin/links', { method: 'PUT', body: { show: l.show, ref: l.ref, label: f.label.value.trim(), note: f.note.value.trim(), greet: f.greet.checked } });
    toast('Saved');
    loadLinks();
  } catch (err) { toast(err.message, true); }
});

// ---------- Telegram alerts ----------
async function loadAlerts() {
  const box = $('alerts');
  let s;
  try { s = await api('/api/admin/alerts'); } catch (e) { box.innerHTML = `<p class="cms-error cms-small">${esc(e.message)}</p>`; return; }
  if (!s.token) {
    box.innerHTML = `<strong>Get a Telegram message when a link is opened</strong>
      <ol class="cms-steps">
        <li>In Telegram, open <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a>, send <code>/newbot</code>, and follow the prompts. It gives you a token.</li>
        <li>In Cloudflare: Workers &amp; Pages → scrollmotions → Settings → Variables and secrets → Add. Type <em>Secret</em>, name <code>TELEGRAM_BOT_TOKEN</code>, paste the token, Save.</li>
        <li>Redeploy the site (Deployments → latest → Retry deployment), then come back here.</li>
      </ol>`;
    return;
  }
  if (s.error) { box.innerHTML = `<p class="cms-error cms-small">${esc(s.error)}</p>`; return; }
  if (!s.connected) {
    box.innerHTML = `<strong>Almost there:</strong> open <a href="https://t.me/${esc(s.bot)}" target="_blank" rel="noopener">@${esc(s.bot)}</a> in Telegram and press <em>Start</em>, then
      <button type="button" class="cms-btn cms-btn-primary" id="tg-connect">Connect</button>`;
    $('tg-connect').onclick = () => alertAction('connect');
    return;
  }
  box.innerHTML = `<span class="cms-opened">● Telegram alerts on</span> <span class="cms-muted">· sending to ${esc(s.chatName || 'you')} via @${esc(s.bot)}</span>
    <button type="button" class="cms-btn" id="tg-test">Send test</button>
    <button type="button" class="cms-btn cms-btn-ghost" id="tg-off">Turn off</button>`;
  $('tg-test').onclick = () => alertAction('test');
  $('tg-off').onclick = () => alertAction('disconnect');
}
async function alertAction(action) {
  try {
    await api('/api/admin/alerts', { method: 'POST', body: { action } });
    toast(action === 'test' ? 'Test sent. Check Telegram' : action === 'connect' ? 'Connected' : 'Alerts off');
  } catch (e) { toast(e.message, true); }
  loadAlerts();
}

$('links-list').addEventListener('click', async e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const row = b.closest('.cms-linkrow');
  const l = linksCache.find(x => x.id === row.dataset.id);
  if (!l) return;
  if (b.dataset.act === 'copy') copy(shareLink(l.show.split(','), l.ref));
  if (b.dataset.act === 'edit') { const f = row.querySelector('.cms-linkrow-edit'); f.hidden = !f.hidden; }
  if (b.dataset.act === 'edit-cancel') row.querySelector('.cms-linkrow-edit').hidden = true;
  if (b.dataset.act === 'delete') {
    if (!confirm(`Stop tracking “${l.label || 'this link'}” and delete its history?\n\nThe link itself keeps working.`)) return;
    await api(`/api/admin/links?id=${encodeURIComponent(l.id)}`, { method: 'DELETE' });
    loadLinks();
  }
  if (b.dataset.act === 'details') {
    const d = row.querySelector('.cms-linkrow-details');
    if (!d.hidden) { d.hidden = true; b.textContent = 'Details'; return; }
    d.hidden = false;
    b.textContent = 'Hide';
    d.innerHTML = '<p class="cms-muted cms-small">Loading…</p>';
    try {
      const { visits } = await api(`/api/admin/links?id=${encodeURIComponent(l.id)}`);
      d.innerHTML = visits.map(v => {
        const mins = Math.max(0, Math.round((v.last_seen - v.started) / 1000));
        const plays = v.plays.length
          ? v.plays.map(p => {
            const yt = (bySlug(p.slug) || {}).youtube;
            const pct = p.duration ? Math.min(100, Math.round((p.seconds / p.duration) * 100)) : null;
            return `<li><span class="cms-play-title">${esc(titleOf(p.slug))}</span>
              ${yt ? '<span class="cms-muted cms-yt-note">opened (YouTube can’t report watch time)</span>'
                : `<span class="cms-bar"><span style="width:${pct ?? 0}%"></span></span><span class="cms-muted">${fmtWatch(p.seconds)}${p.duration ? ` of ${fmtWatch(p.duration)} · ${pct}%` : ''}</span>`}</li>`;
          }).join('')
          : '<li class="cms-muted">Looked at the page, didn’t play a video</li>';
        return `<div class="cms-visit">
          <div><strong>${esc(when(v.started))}</strong> <span class="cms-muted">· ${esc(place(v))} · ${esc(v.device || '')}${mins > 5 ? ` · on page ${fmtWatch(mins)}` : ''}</span></div>
          ${v.contacted ? `<div class="cms-reached cms-small">${v.contacted.split(',').map(c => (c === 'whatsapp' ? '💬 Tapped WhatsApp' : '📅 Opened booking page')).join(' · ')}</div>` : ''}
          <ul class="cms-plays">${plays}</ul>
        </div>`;
      }).join('') || '<p class="cms-muted cms-small">No visits yet.</p>';
    } catch (err) {
      d.innerHTML = `<p class="cms-error">${esc(err.message)}</p>`;
    }
  }
});

$('link-add').addEventListener('submit', async e => {
  e.preventDefault();
  let u;
  try { u = new URL($('link-add-url').value.trim()); } catch { toast('That isn’t a valid link', true); return; }
  const show = u.searchParams.get('show');
  if (!show) { toast('That link has no ?show= videos in it', true); return; }
  try {
    await api('/api/admin/links', { method: 'PUT', body: { show, ref: u.searchParams.get('ref') || '', label: $('link-add-name').value.trim() } });
    $('link-add-url').value = '';
    $('link-add-name').value = '';
    toast('Tracking that link');
    loadLinks();
  } catch (err) { toast(err.message, true); }
});

// ---------- Categories ----------
function renderCategories() {
  const counts = id => catalog.videos.filter(v => v.category === id).length;
  $('cat-list').innerHTML = catalog.categories.map((c, i) => `
    <div class="cms-cat" data-id="${esc(c.id)}">
      <div class="cms-cat-fields">
        <input data-field="label" value="${esc(c.label)}" maxlength="60" aria-label="Category name">
        <input data-field="desc" value="${esc(c.desc)}" maxlength="200" placeholder="One-line description" aria-label="Category description">
      </div>
      <span class="cms-muted">${counts(c.id)} videos</span>
      <div class="cms-row-actions">
        <button type="button" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
        <button type="button" data-act="down" ${i === catalog.categories.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
        <button type="button" data-act="delete" class="cms-danger" ${counts(c.id) ? 'disabled title="Move its videos to another category first"' : ''}>Delete</button>
      </div>
    </div>`).join('');
}

$('cat-list').addEventListener('input', e => {
  const input = e.target.closest('input[data-field]');
  if (!input) return;
  const c = catById(input.closest('.cms-cat').dataset.id);
  c[input.dataset.field] = input.value;
  if (input.dataset.field === 'label' && !input.value.trim()) return; // wait for a name
  renderFilters();
  queueSave(1200);
});

$('cat-list').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const cats = catalog.categories;
  const i = cats.findIndex(c => c.id === b.closest('.cms-cat').dataset.id);
  if (b.dataset.act === 'up' && i > 0) [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]];
  if (b.dataset.act === 'down' && i < cats.length - 1) [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]];
  if (b.dataset.act === 'delete') {
    if (!confirm(`Delete the “${cats[i].label}” category?`)) return;
    cats.splice(i, 1);
  }
  renderCategories();
  renderFilters();
  renderVideos();
  queueSave();
});

$('add-cat').addEventListener('click', () => {
  const name = prompt('Name of the new category:');
  if (!name || !name.trim()) return;
  let id = slugify(name) || 'category';
  for (let n = 2; catById(id); n++) id = `${slugify(name)}-${n}`;
  catalog.categories.push({ id, label: name.trim(), desc: '' });
  renderCategories();
  renderFilters();
  renderVideos();
  queueSave(0);
});

// ---------- Add / edit dialog ----------
const ed = {
  mode: 'add',      // 'add' | 'edit'
  video: null,      // the entry being edited
  file: null,       // chosen video file
  fileUrl: null,    // object URL for the preview
  youtube: null,    // YouTube id
  posterBlob: null, // uploaded image, overrides the frame
  frameChanged: false,
  slugTouched: false,
  duration: 0,
};

const dlg = $('editor');

function sourceMode() { return dlg.querySelector('input[name="source"]:checked').value; }

function resetEditor() {
  if (ed.fileUrl) URL.revokeObjectURL(ed.fileUrl);
  Object.assign(ed, { video: null, editLoad: null, file: null, fileUrl: null, youtube: null, posterBlob: null, frameChanged: false, slugTouched: false, duration: 0 });
  $('editor-form').reset();
  $('editor-error').hidden = true;
  $('progress').hidden = true;
  $('file-info').hidden = true;
  $('drop-empty').hidden = false;
  $('frame-zone').hidden = true;
  $('frame-video').removeAttribute('src');
  $('frame-video').hidden = false;
  $('frame-img').hidden = true;
  $('frame-img').removeAttribute('src');
  $('slug-hint').textContent = '';
  setFormDisabled(false);
}

function fillCategoryOptions(selected) {
  $('f-category').innerHTML = catalog.categories
    .map(c => `<option value="${esc(c.id)}"${c.id === selected ? ' selected' : ''}>${esc(c.label)}</option>`).join('');
}

function syncSourceUI() {
  const edit = ed.mode === 'edit';
  const yt = sourceMode() === 'youtube';
  $('source-pick').hidden = edit;
  $('file-zone').hidden = edit || yt;
  $('yt-zone').hidden = edit || !yt;
}

function openEditor(video = null) {
  resetEditor();
  ed.mode = video ? 'edit' : 'add';
  ed.video = video;
  fillCategoryOptions(video ? video.category : (filterCat !== 'all' ? filterCat : catalog.categories[0].id));
  $('editor-title').textContent = video ? 'Edit video' : 'Add video';
  $('editor-save').textContent = video ? 'Save' : 'Upload & publish';
  $('f-slug').readOnly = !!video;

  if (video) {
    $('f-title').value = video.title;
    $('f-client').value = video.client || '';
    $('f-blurb').value = video.blurb || '';
    $('f-format').value = video.format;
    $('f-slug').value = video.slug;
    $('f-featured').checked = catalog.featured.includes(video.slug);
    $('slug-hint').textContent = `Share link: ${shareLink(video.slug)} (the link name can't change once links are out)`;
    ed.duration = video.duration || 0;
    showFrameZone(video);
  }
  syncSourceUI();
  dlg.showModal();
  if (!video) $('f-title').blur();
}

function showFrameZone(video) {
  $('frame-zone').hidden = false;
  if (video && video.youtube) {
    $('frame-video').hidden = true;
    $('frame-img').hidden = false;
    $('frame-img').src = video.poster;
    $('frame-slider').hidden = true;
    $('frame-time').textContent = 'YouTube thumbnail';
    return;
  }
  $('frame-slider').hidden = false;
  const vid = $('frame-video');
  vid.hidden = false;
  $('frame-img').hidden = true;
  if (video) {
    // Show the current thumbnail; the video loads when the slider is first used
    vid.hidden = true;
    $('frame-img').hidden = false;
    $('frame-img').src = video.poster;
    $('frame-time').textContent = 'Drag to pick a new frame';
  }
}

// Videos that ship with the site can't be seeked over the network (no range
// support), so the edit view loads the whole file once before picking a frame.
async function loadEditVideo() {
  if (ed.editLoad) return ed.editLoad;
  const v = ed.video;
  $('frame-time').textContent = 'Loading video…';
  ed.editLoad = fetch(v.src)
    .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
    .then(blob => new Promise((resolve, reject) => {
      ed.fileUrl = URL.createObjectURL(blob);
      const vid = $('frame-video');
      vid.addEventListener('loadeddata', resolve, { once: true });
      vid.addEventListener('error', reject, { once: true });
      vid.src = ed.fileUrl;
    }))
    .catch(() => {
      ed.editLoad = null;
      $('frame-time').textContent = 'Couldn’t load the video. Upload an image instead.';
      throw new Error('load failed');
    });
  return ed.editLoad;
}

dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeEditor()));
dlg.addEventListener('cancel', e => { if (busyUploading) e.preventDefault(); else resetEditor(); });
function closeEditor() {
  if (busyUploading) return;
  dlg.close();
  resetEditor();
}

dlg.querySelectorAll('input[name="source"]').forEach(r => r.addEventListener('change', () => {
  syncSourceUI();
  $('frame-zone').hidden = true;
  ed.youtube = null;
  if (sourceMode() === 'file' && ed.file) showFrameZone();
}));

// File picking
$('file-browse').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', e => e.target.files[0] && pickFile(e.target.files[0]));
const zone = $('file-zone');
['dragenter', 'dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('is-over'); }));
['dragleave', 'drop'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.remove('is-over'); }));
zone.addEventListener('drop', e => {
  const f = [...(e.dataTransfer.files || [])].find(x => x.type.startsWith('video/') || /\.(mp4|m4v|mov|webm)$/i.test(x.name));
  if (f) pickFile(f); else toast('That isn’t a video file', true);
});

function pickFile(file) {
  ed.file = file;
  if (ed.fileUrl) URL.revokeObjectURL(ed.fileUrl);
  ed.fileUrl = URL.createObjectURL(file);
  $('drop-empty').hidden = true;
  const info = $('file-info');
  info.hidden = false;
  const big = file.size > 80e6;
  info.innerHTML = `<strong>${esc(file.name)}</strong> · ${fmtSize(file.size)} · <button type="button" class="cms-link" id="file-change">change</button>`
    + (big ? '<br><span class="cms-warn">Large file: it will upload, but visitors will wait longer. A 1080p H.264 export under 60 MB plays faster.</span>' : '');
  $('file-change').onclick = () => $('file-input').click();

  if (!$('f-title').value) {
    $('f-title').value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!ed.slugTouched) $('f-slug').value = uniqueSlug($('f-title').value);
    updateSlugHint();
  }
  showFrameZone();
  const vid = $('frame-video');
  vid.removeAttribute('poster');
  vid.src = ed.fileUrl;
}

$('frame-video').addEventListener('loadedmetadata', e => {
  const v = e.target;
  if (!Number.isFinite(v.duration)) return;
  ed.duration = v.duration;
  if (ed.mode === 'add' && v.videoWidth) {
    const r = v.videoWidth / v.videoHeight;
    $('f-format').value = r > 1.15 ? 'landscape' : r < 0.87 ? 'vertical' : 'square';
  }
  if (ed.mode === 'add') {
    // Start a little way in; first frames are often black
    v.currentTime = Math.min(v.duration * 0.1, 3);
    $('frame-slider').value = String(Math.round((v.currentTime / v.duration) * 1000));
  }
  if (ed.mode === 'add') $('frame-time').textContent = `${fmtTime(v.currentTime) || '0:00'} / ${fmtTime(v.duration)}`;
});
$('frame-video').addEventListener('error', () => {
  if (ed.mode === 'add' && ed.file) {
    $('frame-time').innerHTML = '<span class="cms-warn">This browser can’t play the file, so many visitors won’t be able to either. Export it as MP4 (H.264), or upload a thumbnail image and continue.</span>';
  }
});

$('frame-slider').addEventListener('input', async e => {
  const v = $('frame-video');
  if (ed.mode === 'edit' && ed.video && !ed.video.youtube) {
    ed.frameChanged = true;
    try { await loadEditVideo(); } catch { ed.frameChanged = false; return; }
  }
  if (!v.duration) return;
  v.currentTime = (Number($('frame-slider').value) / 1000) * v.duration;
  ed.frameChanged = true;
  ed.posterBlob = null;
  $('frame-img').hidden = true;
  v.hidden = false;
  $('frame-time').textContent = `${fmtTime(v.currentTime) || '0:00'} / ${fmtTime(v.duration)}`;
});

$('poster-upload-btn').addEventListener('click', () => $('poster-input').click());
$('poster-input').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 10e6) { toast('Thumbnail images must be under 10 MB', true); return; }
  ed.posterBlob = f;
  const img = $('frame-img');
  img.src = URL.createObjectURL(f);
  img.hidden = false;
  $('frame-video').hidden = true;
  $('frame-time').textContent = 'Using your image';
});

async function captureFrame() {
  const v = $('frame-video');
  if (!v.videoWidth) return null;
  if (v.seeking) await new Promise(r => v.addEventListener('seeked', r, { once: true }));
  const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(v.videoWidth * scale);
  c.height = Math.round(v.videoHeight * scale);
  try {
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  } catch { return null; }
  return new Promise(r => c.toBlob(b => r(b), 'image/jpeg', 0.82));
}

// YouTube
function parseYouTube(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : null;
}
$('yt-url').addEventListener('input', e => {
  const id = parseYouTube(e.target.value);
  ed.youtube = id;
  if (!id) { $('frame-zone').hidden = true; return; }
  $('f-format').value = /\/shorts\//.test(e.target.value) ? 'vertical' : 'landscape';
  showFrameZone({ youtube: id, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
});

// Title → link name
$('f-title').addEventListener('input', () => {
  if (ed.mode === 'add' && !ed.slugTouched) $('f-slug').value = uniqueSlug($('f-title').value);
  updateSlugHint();
});
$('f-slug').addEventListener('input', () => { ed.slugTouched = true; updateSlugHint(); });
function updateSlugHint() {
  if (ed.mode !== 'add') return;
  const s = $('f-slug').value;
  $('slug-hint').textContent = s ? `Share link: ${shareLink(s)}` : '';
}

function setFormDisabled(on) {
  dlg.querySelectorAll('input, select, button').forEach(el => {
    if (!el.closest('.cms-progress')) el.disabled = on;
  });
}

function showError(msg) {
  $('editor-error').textContent = msg;
  $('editor-error').hidden = false;
}

function progress(frac, text) {
  $('progress').hidden = false;
  $('progress-fill').style.width = `${Math.round(frac * 100)}%`;
  $('progress-text').textContent = text;
}

$('editor-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('editor-error').hidden = true;
  const title = $('f-title').value.trim();
  if (!title) return showError('Add a title.');
  const fields = {
    title,
    client: $('f-client').value.trim(),
    category: $('f-category').value,
    blurb: $('f-blurb').value.trim(),
    format: $('f-format').value,
  };
  const wantFeatured = $('f-featured').checked;

  if (ed.mode === 'edit') return saveEdit(fields, wantFeatured);

  const slug = slugify($('f-slug').value);
  if (!slug) return showError('Add a link name (letters, numbers and dashes).');
  if (bySlug(slug)) return showError('Another video already uses that link name.');
  const yt = sourceMode() === 'youtube';
  if (yt && !ed.youtube) return showError('Paste a YouTube link.');
  if (!yt && !ed.file) return showError('Choose a video file.');
  if (wantFeatured && catalog.featured.length >= MAX_FEATURED) return showError(`“Start here” already has ${MAX_FEATURED} videos. Untick it, or remove one first.`);

  busyUploading = true;
  setFormDisabled(true);
  let uploaded = [];
  try {
    const entry = { slug, ...fields };
    if (yt) {
      entry.youtube = ed.youtube;
      entry.poster = `https://i.ytimg.com/vi/${ed.youtube}/hqdefault.jpg`;
    } else {
      progress(0, 'Preparing thumbnail…');
      const poster = ed.posterBlob || await captureFrame();
      if (!poster) throw new Error('Couldn’t grab a thumbnail from this video. Upload a thumbnail image instead.');
      const started = Date.now();
      entry.src = await uploadVideo(ed.file, slug, f => {
        const secs = (Date.now() - started) / 1000;
        const left = f > 0.02 ? Math.round(secs / f - secs) : null;
        progress(f * 0.95, `Uploading video… ${Math.round(f * 100)}%${left !== null && left > 5 ? ` · about ${left > 90 ? `${Math.round(left / 60)} min` : `${left} s`} left` : ''} — keep this tab open`);
      });
      uploaded.push(entry.src);
      progress(0.96, 'Uploading thumbnail…');
      entry.poster = await uploadPoster(poster, slug);
      uploaded.push(entry.poster);
      if (ed.duration) entry.duration = Math.round(ed.duration);
    }

    progress(0.98, 'Publishing…');
    // Newest first within its category
    const firstInCat = catalog.videos.findIndex(v => v.category === entry.category);
    if (firstInCat >= 0) catalog.videos.splice(firstInCat, 0, entry); else catalog.videos.push(entry);
    if (wantFeatured) toggleFeatured(slug, true);
    try {
      await saveNow();
    } catch (err) {
      catalog.videos.splice(catalog.videos.indexOf(entry), 1);
      catalog.featured = catalog.featured.filter(s => s !== slug);
      throw err;
    }
    uploaded = [];
    progress(1, 'Live on your portfolio');
    busyUploading = false;
    renderAll();
    closeEditor();
    toast(`“${title}” is live`);
  } catch (err) {
    uploaded.forEach(deleteMedia);
    showError(err.message);
    $('progress').hidden = true;
  } finally {
    busyUploading = false;
    setFormDisabled(false);
    syncSourceUI();
  }
});

async function saveEdit(fields, wantFeatured) {
  const v = ed.video;
  const wasFeatured = catalog.featured.includes(v.slug);
  if (wantFeatured && !wasFeatured && catalog.featured.length >= MAX_FEATURED) {
    return showError(`“Start here” already has ${MAX_FEATURED} videos. Untick it, or remove one first.`);
  }
  busyUploading = true;
  setFormDisabled(true);
  const before = { ...v };
  let newPoster = null;
  try {
    if (!v.youtube && (ed.posterBlob || ed.frameChanged)) {
      progress(0.3, 'Uploading new thumbnail…');
      if (!ed.posterBlob && ed.editLoad) {
        await ed.editLoad;
        const fv = $('frame-video');
        const t = (Number($('frame-slider').value) / 1000) * fv.duration;
        if (Math.abs(fv.currentTime - t) > 0.05) {
          fv.currentTime = t;
          await new Promise(r => fv.addEventListener('seeked', r, { once: true }));
        }
      }
      const blob = ed.posterBlob || await captureFrame();
      if (!blob) throw new Error('Couldn’t grab that frame. Upload a thumbnail image instead.');
      newPoster = await uploadPoster(blob, v.slug);
    }
    Object.assign(v, fields);
    if (newPoster) v.poster = newPoster;
    if (wantFeatured !== wasFeatured) toggleFeatured(v.slug, wantFeatured);
    progress(0.8, 'Publishing…');
    try {
      await saveNow();
    } catch (err) {
      Object.assign(v, before);
      if (wantFeatured !== wasFeatured) toggleFeatured(v.slug, wasFeatured);
      throw err;
    }
    if (newPoster && before.poster !== newPoster) deleteMedia(before.poster);
    busyUploading = false;
    renderAll();
    closeEditor();
    toast('Saved');
  } catch (err) {
    if (newPoster) deleteMedia(newPoster);
    showError(err.message);
    $('progress').hidden = true;
  } finally {
    busyUploading = false;
    setFormDisabled(false);
    if (ed.video) $('f-slug').readOnly = true;
    syncSourceUI();
  }
}

$('add-video').addEventListener('click', () => openEditor());

// ---------- Go ----------
start().catch(e => {
  $('setup-msg').textContent = e.message;
  showOnly('setup');
});
