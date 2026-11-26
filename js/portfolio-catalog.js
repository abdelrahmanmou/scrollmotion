// Loads the portfolio list.
//
// The CMS (/admin) saves the list to Cloudflare R2 and serves it at /api/catalog.
// If that isn't available (local `npm run dev`, or before the CMS has saved
// anything) the built-in list in portfolio-data.js is used instead.
import * as builtIn from './portfolio-data.js';

export const BUILT_IN = {
  categories: builtIn.CATEGORIES,
  featured: builtIn.FEATURED,
  videos: builtIn.VIDEOS,
};

export async function loadCatalog({ timeoutMs = 4000 } = {}) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch('/api/catalog', { signal: ctrl.signal, headers: { accept: 'application/json' } });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.videos) && Array.isArray(data.categories)) {
        return {
          CATEGORIES: data.categories,
          FEATURED: data.featured || [],
          VIDEOS: data.videos.filter(v => !v.hidden),
          source: 'cms',
        };
      }
    }
  } catch { /* fall back to the built-in list */ }
  return { CATEGORIES: BUILT_IN.categories, FEATURED: BUILT_IN.featured, VIDEOS: BUILT_IN.videos, source: 'built-in' };
}
