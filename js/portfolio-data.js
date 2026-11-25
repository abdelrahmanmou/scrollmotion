// Portfolio catalogue.
//
// Each video has a stable `slug`. Slugs are used in share links such as
//   /portfolio.html?show=azza-fahmy,hub-xyz
// so never rename a slug once a link has been sent. To add a video:
//   1. Put a web-compressed MP4 in public/videos/<slug>.mp4 (keep it under 25 MiB)
//   2. Put a poster frame in public/posters/<slug>.jpg
//   3. Add an entry below.
// Files in public/ are served from the site root, so paths start with "/".

export const CATEGORIES = [
  { id: 'saas', label: 'SaaS & Tech' },
  { id: 'brand', label: 'Ads & Brand' },
  { id: 'story', label: 'Documentary & Edu' },
  { id: 'testimonials', label: 'Client Testimonials' },
  { id: 'reels', label: 'Social Reels' },
  { id: 'longform', label: 'Long-form YouTube' },
];

const local = (slug, extra) => ({
  slug,
  src: `/videos/${slug}.mp4`,
  poster: `/posters/${slug}.jpg`,
  ...extra,
});

const youtube = (slug, id, extra) => ({
  slug,
  youtube: id,
  poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  format: 'landscape',
  ...extra,
});

const reel = (n, duration, format) => ({
  slug: `reel-${n}`,
  src: `/social-media-reel-${n}.mp4`,
  poster: `/posters/reel-${n}.jpg`,
  title: `Social Reel ${String(n).padStart(2, '0')}`,
  client: 'Short-form marketing',
  category: 'reels',
  format,
  duration,
});

export const VIDEOS = [
  // SaaS & Tech
  local('hub-xyz', { title: 'Hub xyz', client: 'Hub xyz', category: 'saas', format: 'landscape', duration: 62, blurb: 'Cinematic SaaS promotion video.' }),
  local('cryptex', { title: 'Cryptex Promo', client: 'Cryptex', category: 'saas', format: 'landscape', duration: 18, blurb: '3D motion graphics and branding.' }),
  local('blackbox-elevenlabs', { title: 'Blackbox × ElevenLabs', client: 'Blackbox', category: 'saas', format: 'landscape', duration: 63, blurb: 'SaaS motion graphics promo.' }),
  local('searchable', { title: 'Searchable', client: 'Searchable', category: 'saas', format: 'landscape', duration: 82, blurb: 'Retro-styled SaaS launch film.' }),
  youtube('indie-crush', 'iMGmx4ZA7JI', { title: 'Indie Crush Explainer', client: 'Indie Crush', category: 'saas', blurb: 'SaaS explainer video.' }),
  youtube('base-supply', 'GgiPSq-xArE', { title: 'Base Supply Overview', client: 'Base Supply', category: 'saas', blurb: 'SaaS product demo.' }),

  // Ads & brand
  local('unicafone', { title: 'Unicaf', client: 'Unicaf University', category: 'brand', format: 'vertical', duration: 28, blurb: 'University ad.' }),
  local('educatly-ad', { title: 'Educatly Ad', client: 'Educatly', category: 'brand', format: 'vertical', duration: 73, blurb: 'Student-recruitment platform ad.' }),

  // Documentary & education
  local('azza-fahmy', { title: 'Azza Fahmy', client: 'Educatly', category: 'story', format: 'vertical', duration: 85, blurb: 'Biography short on the jewellery designer.' }),
  local('mostafa-mosharrafa', { title: 'Mostafa Mosharrafa', client: 'Educatly', category: 'story', format: 'vertical', duration: 67, blurb: 'Archive-driven biography short.' }),
  local('ahmed-el-shuqairy', { title: 'Ahmed El-Shuqairy', client: 'Educatly', category: 'story', format: 'vertical', duration: 63, blurb: 'Biography short.' }),
  local('ten-seconds', { title: 'Editorial Launch Video', client: '', category: 'saas', format: 'landscape', duration: 18, blurb: 'Editorial launch film built from archive footage.' }),

  // Client testimonials (clients talking about working with Scroll Studio)
  local('alex-saint', { title: 'Alex Saint', client: 'Indie Crush', category: 'testimonials', format: 'vertical', duration: 34, blurb: 'Client testimonial.' }),
  local('dean', { title: 'Dean', client: '', category: 'testimonials', format: 'vertical', duration: 32, blurb: 'Client testimonial.' }),

  // Social reels
  ...[17, 29, 10, 25, 34, 5, 7, 13, 24, 4, 14, 7, 32, 20, 13, 9, 6, 8, 40].map((d, i) =>
    reel(i + 1, d, i + 1 === 14 ? 'landscape' : 'vertical')),

  // Long-form YouTube
  youtube('el-reno-tornado', 'Ppw0W5IXNAI', { title: 'El Reno Tornado Documentary', client: 'YouTube', category: 'longform', blurb: 'Documentary editing.' }),
  youtube('digital-launchpad', 'sjnAYnpWrzU', { title: 'Digital Launchpad Review', client: 'YouTube', category: 'longform', blurb: 'Product review.' }),
  youtube('shopify-dropshipping', 'P2mnVDrl7vM', { title: 'Shopify Dropshipping', client: 'YouTube', category: 'longform', blurb: 'Case study.' }),
  youtube('f1-moments', 'miixnqPhUvE', { title: 'Funniest F1 Moments', client: 'YouTube', category: 'longform', blurb: 'Compilation.' }),
];

// Old share links used #anchors on the previous page layout; map them to slugs.
export const LEGACY_ANCHORS = {
  'reel-ahmed': 'ahmed-el-shuqairy',
  'reel-edited': 'educatly-ad',
  'reel-mostafa': 'mostafa-mosharrafa',
  'reel-unicafone': 'unicafone',
  'reel-azza': 'azza-fahmy',
};
