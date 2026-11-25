import { CATEGORIES, VIDEOS, LEGACY_ANCHORS } from './portfolio-data.js';

const bySlug = new Map(VIDEOS.map(v => [v.slug, v]));
const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || '';

const els = {
  picked: document.getElementById('pf-picked'),
  pickedGrid: document.getElementById('pf-picked-grid'),
  pickedTitle: document.getElementById('pf-picked-title'),
  filters: document.getElementById('pf-filters'),
  grid: document.getElementById('pf-grid'),
  allTitle: document.getElementById('pf-all-title'),
  selectToggle: document.getElementById('pf-select-toggle'),
  bar: document.getElementById('pf-bar'),
  barCount: document.getElementById('pf-bar-count'),
  barList: document.getElementById('pf-bar-list'),
  barCopy: document.getElementById('pf-bar-copy'),
  barOpen: document.getElementById('pf-bar-open'),
  barClear: document.getElementById('pf-bar-clear'),
  barDone: document.getElementById('pf-bar-done'),
  lightbox: document.getElementById('pf-lightbox'),
  lbStage: document.getElementById('pf-lb-stage'),
  lbTitle: document.getElementById('pf-lb-title'),
  lbMeta: document.getElementById('pf-lb-meta'),
  lbShare: document.getElementById('pf-lb-share'),
  toast: document.getElementById('pf-toast'),
};

// ---------- State ----------
const params = new URLSearchParams(location.search);
const pickedSlugs = (params.get('show') || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter((s, i, arr) => s && bySlug.has(s) && arr.indexOf(s) === i);

let activeFilter = 'all';
let selectMode = false;
const selection = []; // ordered slugs
let lbList = [];
let lbIndex = 0;

// ---------- Helpers ----------
const fmtTime = s => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '');

function shareUrl(slugs) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('show', slugs.join(','));
  // keep commas readable in the link
  return url.toString().replace(/%2C/g, ',');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    return ok;
  }
}

let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};

// ---------- Cards ----------
function card(v, { picked = false } = {}) {
  const el = document.createElement('article');
  el.className = `pf-card pf-${v.format}${picked ? ' is-picked' : ''}`;
  el.dataset.slug = v.slug;
  el.id = `v-${v.slug}`;
  el.innerHTML = `
    <button class="pf-thumb" type="button" aria-label="Play ${v.title}">
      <span class="pf-thumb-bg" style="background-image:url('${v.poster}')"></span>
      <img class="pf-thumb-img${v.youtube ? ' is-yt' : ''}" src="${v.poster}" alt="" loading="lazy" decoding="async">
      <span class="pf-play">${ICONS.play}</span>
      ${v.duration ? `<span class="pf-badge pf-dur">${fmtTime(v.duration)}</span>` : ''}
      ${v.youtube ? '<span class="pf-badge pf-yt">YouTube</span>' : ''}
      <span class="pf-check" aria-hidden="true">${ICONS.check}<span class="pf-check-n"></span></span>
    </button>
    <div class="pf-info">
      <div class="pf-text">
        <h3>${v.title}</h3>
        <p>${v.client && v.client !== v.title ? `${v.client} · ` : ''}${catLabel(v.category)}</p>
      </div>
      <button class="pf-share" type="button" aria-label="Copy link to ${v.title}" title="Copy link to this video">${ICONS.link}</button>
    </div>`;

  // Hover preview on devices with a mouse
  if (v.src && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const thumb = el.querySelector('.pf-thumb');
    let vid;
    thumb.addEventListener('mouseenter', () => {
      if (selectMode) return;
      vid = document.createElement('video');
      Object.assign(vid, { src: v.src, muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto' });
      vid.className = 'pf-preview';
      vid.addEventListener('playing', () => vid && vid.classList.add('on'));
      thumb.appendChild(vid);
    });
    thumb.addEventListener('mouseleave', () => {
      if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.remove(); vid = null; }
    });
  }
  return el;
}

function renderPicked() {
  if (!pickedSlugs.length) return;
  els.picked.hidden = false;
  els.pickedTitle.textContent = pickedSlugs.length === 1 ? 'Picked for you' : `${pickedSlugs.length} videos picked for you`;
  pickedSlugs.forEach(s => els.pickedGrid.appendChild(card(bySlug.get(s), { picked: true })));
  els.allTitle.textContent = 'More work';
  document.title = `Selected work – Scroll Studio`;
}

function visibleVideos() {
  const rest = VIDEOS.filter(v => !pickedSlugs.includes(v.slug));
  return activeFilter === 'all' ? rest : rest.filter(v => v.category === activeFilter);
}

function renderFilters() {
  const rest = VIDEOS.filter(v => !pickedSlugs.includes(v.slug));
  const chips = [{ id: 'all', label: 'All', n: rest.length }]
    .concat(CATEGORIES.map(c => ({ ...c, n: rest.filter(v => v.category === c.id).length })))
    .filter(c => c.n > 0);
  els.filters.innerHTML = chips
    .map(c => `<button type="button" class="pf-chip${c.id === activeFilter ? ' active' : ''}" data-filter="${c.id}" aria-pressed="${c.id === activeFilter}">${c.label}<span>${c.n}</span></button>`)
    .join('');
}

function renderGrid() {
  els.grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  visibleVideos().forEach(v => frag.appendChild(card(v)));
  els.grid.appendChild(frag);
  syncSelectionUI();
}

// ---------- Selection mode ----------
function setSelectMode(on) {
  selectMode = on;
  document.body.classList.toggle('pf-selecting', on);
  els.selectToggle.setAttribute('aria-pressed', String(on));
  els.selectToggle.querySelector('span').textContent = on ? 'Done selecting' : 'Create share link';
  if (on && !selection.length && pickedSlugs.length) selection.push(...pickedSlugs);
  syncSelectionUI();
}

function toggleSelected(slug) {
  const i = selection.indexOf(slug);
  if (i >= 0) selection.splice(i, 1);
  else selection.push(slug);
  syncSelectionUI();
}

function syncSelectionUI() {
  document.querySelectorAll('.pf-card').forEach(c => {
    const n = selection.indexOf(c.dataset.slug);
    c.classList.toggle('is-selected', selectMode && n >= 0);
    c.querySelector('.pf-check-n').textContent = n >= 0 ? n + 1 : '';
  });
  els.bar.hidden = !selectMode;
  els.barCount.textContent = selection.length
    ? `${selection.length} selected · shown first, in this order`
    : 'Tap videos to pick them';
  els.barList.innerHTML = selection
    .map((s, i) => `<li><span>${i + 1}</span>${bySlug.get(s).title}<button type="button" data-remove="${s}" aria-label="Remove ${bySlug.get(s).title}">×</button></li>`)
    .join('');
  els.barCopy.disabled = !selection.length;
  els.barOpen.disabled = !selection.length;
  els.barClear.disabled = !selection.length;
}

// ---------- Lightbox ----------
function openLightbox(slug, list) {
  lbList = list;
  lbIndex = Math.max(0, list.indexOf(slug));
  showInLightbox();
  if (!els.lightbox.open) els.lightbox.showModal();
  document.documentElement.classList.add('pf-lock');
}

function showInLightbox() {
  const v = bySlug.get(lbList[lbIndex]);
  els.lbStage.className = `pf-lb-stage pf-${v.format}`;
  if (v.youtube) {
    els.lbStage.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.youtube}?autoplay=1&rel=0" title="${v.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  } else {
    els.lbStage.innerHTML = `<video src="${v.src}" poster="${v.poster}" controls autoplay playsinline></video>`;
  }
  els.lbTitle.textContent = v.title;
  els.lbMeta.textContent = [v.client !== v.title ? v.client : '', catLabel(v.category), v.blurb].filter(Boolean).join(' · ');
  els.lightbox.querySelectorAll('.pf-lb-nav').forEach(b => (b.hidden = lbList.length < 2));
}

function closeLightbox() {
  els.lbStage.innerHTML = '';
  if (els.lightbox.open) els.lightbox.close();
  document.documentElement.classList.remove('pf-lock');
}

function step(d) {
  lbIndex = (lbIndex + d + lbList.length) % lbList.length;
  showInLightbox();
}

// ---------- Events ----------
function onCardClick(e) {
  const c = e.target.closest('.pf-card');
  if (!c) return;
  const slug = c.dataset.slug;

  if (e.target.closest('.pf-share')) {
    copyText(shareUrl([slug])).then(ok => toast(ok ? 'Link copied' : 'Could not copy the link'));
    return;
  }
  if (selectMode) {
    toggleSelected(slug);
    return;
  }
  if (e.target.closest('.pf-thumb')) {
    // Arrow keys walk through picked videos first, then the current filter
    openLightbox(slug, pickedSlugs.concat(visibleVideos().map(v => v.slug)));
  }
}

els.pickedGrid.addEventListener('click', onCardClick);
els.grid.addEventListener('click', onCardClick);

els.filters.addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  activeFilter = b.dataset.filter;
  renderFilters();
  renderGrid();
});

els.selectToggle.addEventListener('click', () => setSelectMode(!selectMode));
els.barDone.addEventListener('click', () => setSelectMode(false));
els.barClear.addEventListener('click', () => { selection.length = 0; syncSelectionUI(); });
els.barList.addEventListener('click', e => {
  const b = e.target.closest('[data-remove]');
  if (b) toggleSelected(b.dataset.remove);
});
els.barCopy.addEventListener('click', async () => {
  const ok = await copyText(shareUrl(selection));
  toast(ok ? `Link copied · ${selection.length} video${selection.length > 1 ? 's' : ''} first` : 'Could not copy the link');
});
els.barOpen.addEventListener('click', () => window.open(shareUrl(selection), '_blank', 'noopener'));

els.lightbox.addEventListener('click', e => {
  if (e.target === els.lightbox || e.target.closest('.pf-lb-close')) closeLightbox();
  else if (e.target.closest('.pf-lb-prev')) step(-1);
  else if (e.target.closest('.pf-lb-next')) step(1);
});
els.lightbox.addEventListener('cancel', e => { e.preventDefault(); closeLightbox(); });
els.lbShare.addEventListener('click', () => {
  copyText(shareUrl([lbList[lbIndex]])).then(ok => toast(ok ? 'Link copied' : 'Could not copy the link'));
});
document.addEventListener('keydown', e => {
  if (!els.lightbox.open) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

// ---------- Init ----------
renderPicked();
renderFilters();
renderGrid();

// Support old #reel-… links from the previous layout
const hash = decodeURIComponent(location.hash.slice(1));
const legacy = LEGACY_ANCHORS[hash] || (bySlug.has(hash) ? hash : null) || (hash.startsWith('v-') && bySlug.has(hash.slice(2)) ? hash.slice(2) : null);
if (legacy) {
  const target = document.getElementById(`v-${legacy}`);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center' });
      target.classList.add('is-flash');
      setTimeout(() => target.classList.remove('is-flash'), 2400);
    });
  }
}
