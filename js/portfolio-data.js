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
  { id: 'saas', label: 'SaaS & Tech', desc: 'Launch films, explainers and feature videos for software products.' },
  { id: 'creator', label: 'Creator Content', desc: 'Retention-edited shorts for creators in finance, real estate and business.' },
  { id: 'brand', label: 'Ads & Brand', desc: 'Brand films, launch reels and performance ads for social.' },
  { id: 'story', label: 'Documentary & Edu', desc: 'Archive-driven biographies and documentary-style films.' },
  { id: 'testimonials', label: 'Client Testimonials', desc: 'Clients talking about what it was like to work with me.' },
  { id: 'reels', label: 'Social Reels', desc: 'Short-form marketing reels.' },
  { id: 'longform', label: 'Long-form YouTube', desc: 'Documentaries, reviews and compilations.' },
];

// Shown in the "Start here" row at the top of the page (first one is the big card).
export const FEATURED = ['searchable', 'goldsand', 'blackbox-elevenlabs'];

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
  local('yozo-anas', { title: 'Yozo · Anas', client: 'Yozo', category: 'saas', format: 'vertical', duration: 66, blurb: 'Retention-focused product ad for a Shopify app.' }),
  local('yozo-retention', { title: 'Yozo Retention', client: 'Yozo', category: 'saas', format: 'vertical', duration: 84, blurb: 'Retention campaign ad.' }),
  local('yozo-shopify-listing', { title: 'Yozo Shopify Listing', client: 'Yozo', category: 'saas', format: 'landscape', duration: 71, blurb: 'Shopify App Store listing video.' }),
  local('yozo-onboarding', { title: 'Yozo Onboarding', client: 'Yozo', category: 'saas', format: 'landscape', duration: 157, blurb: 'Product onboarding walkthrough.' }),
  local('yozo-order-confirmation', { title: 'Yozo · Order Confirmation', client: 'Yozo', category: 'saas', format: 'vertical', duration: 66, blurb: 'Arabic feature video.' }),
  local('yozo-zena-ai', { title: 'Yozo · Zena AI', client: 'Yozo', category: 'saas', format: 'landscape', duration: 66, blurb: 'Arabic feature video for the AI assistant.' }),
  local('yozo-abandoned-carts', { title: 'Yozo · Abandoned Carts', client: 'Yozo', category: 'saas', format: 'vertical', duration: 65, blurb: 'Arabic feature video.' }),
  local('yozo-promo-square', { title: 'Yozo Promo', client: 'Yozo', category: 'saas', format: 'square', duration: 26, blurb: 'Square promo for feeds.' }),
  local('boardworks-explainer', { title: 'BoardWorks Explainer', client: 'BoardWorks', category: 'saas', format: 'landscape', duration: 58, blurb: '60-second product explainer.' }),
  local('hub-xyz', { title: 'Hub xyz', client: 'Hub xyz', category: 'saas', format: 'landscape', duration: 62, blurb: 'Cinematic SaaS promotion video.' }),
  local('cryptex', { title: 'Cryptex Promo', client: 'Cryptex', category: 'saas', format: 'landscape', duration: 18, blurb: '3D motion graphics and branding.' }),
  local('blackbox-elevenlabs', { title: 'Blackbox × ElevenLabs', client: 'Blackbox', category: 'saas', format: 'landscape', duration: 63, blurb: 'SaaS motion graphics promo.' }),
  local('searchable', { title: 'Searchable', client: 'Searchable', category: 'saas', format: 'landscape', duration: 82, blurb: 'Retro-styled SaaS launch film.' }),
  youtube('indie-crush', 'iMGmx4ZA7JI', { title: 'Indie Crush Explainer', client: 'Indie Crush', category: 'saas', blurb: 'SaaS explainer video.' }),
  youtube('base-supply', 'GgiPSq-xArE', { title: 'Base Supply Overview', client: 'Base Supply', category: 'saas', blurb: 'SaaS product demo.' }),

  // Ads & brand
  local('yozo-testimonials', { title: 'Yozo Customer Testimonials', client: 'Yozo', category: 'brand', format: 'vertical', duration: 59, blurb: 'Three merchants, one cut.' }),
  local('yozo-ai-ugc', { title: 'Yozo AI UGC Ad', client: 'Yozo', category: 'brand', format: 'vertical', duration: 45, blurb: 'AI-generated UGC-style ad.' }),
  local('time-is-money', { title: 'Time Is Money', client: '', category: 'brand', format: 'vertical', duration: 15, blurb: 'Short motion piece.' }),
  local('so-by-sora-launch', { title: 'SO by Sora · Website Launch', client: 'SO by Sora', category: 'brand', format: 'vertical', duration: 23, blurb: 'Website launch reel.' }),
  local('sora-collection-what-stays', { title: 'Sora Collection · What Stays', client: 'Sora Collection', category: 'brand', format: 'vertical', duration: 18, blurb: 'Brand film for social.' }),
  local('sora-jameel', { title: 'SORA · Jameel', client: 'SORA Tea & Coffee', category: 'brand', format: 'vertical', duration: 49, blurb: 'Recut with new voiceover.' }),
  local('bayt-zayn-branding', { title: 'Bayt Zayn Branding Reel', client: 'Bayt Zayn', category: 'brand', format: 'vertical', duration: 15, blurb: 'Home-organising brand reel.' }),
  local('andaa-brand-story', { title: 'Andaa Brand Story', client: 'Andaa Equestrian Center', category: 'brand', format: 'vertical', duration: 89, blurb: 'Brand film.' }),
  local('society-website', { title: 'Society Website Showcase', client: 'Society by So Fleur', category: 'brand', format: 'vertical', duration: 21, blurb: 'Website showcase.' }),
  local('workwise-marketing-strategy', { title: 'WorkWise · Marketing Strategy', client: 'WorkWise', category: 'brand', format: 'vertical', duration: 49, blurb: '3D camera motion video.' }),
  local('workwise-about', { title: 'About WorkWise', client: 'WorkWise', category: 'brand', format: 'vertical', duration: 29, blurb: 'Agency motion video.' }),
  local('workwise-our-work', { title: 'WorkWise · Our Work', client: 'WorkWise', category: 'brand', format: 'vertical', duration: 29, blurb: 'Agency portfolio reel.' }),
  local('workwise-3-second-audition', { title: 'WorkWise · 3-Second Audition', client: 'WorkWise Media', category: 'brand', format: 'vertical', duration: 12, blurb: 'Social reel.' }),
  local('unicafone', { title: 'Unicaf', client: 'Unicaf University', category: 'brand', format: 'vertical', duration: 28, blurb: 'University ad.' }),
  local('educatly-ad', { title: 'Educatly Ad', client: 'Educatly', category: 'brand', format: 'vertical', duration: 73, blurb: 'Student-recruitment platform ad.' }),

  // Documentary & education
  local('goldsand', { title: 'Goldsand', client: 'Goldsand', category: 'story', format: 'landscape', duration: 56, blurb: 'Documentary-style pitch film.' }),
  local('azza-fahmy', { title: 'Azza Fahmy', client: 'Educatly', category: 'story', format: 'vertical', duration: 85, blurb: 'Biography short on the jewellery designer.' }),
  local('mostafa-mosharrafa', { title: 'Mostafa Mosharrafa', client: 'Educatly', category: 'story', format: 'vertical', duration: 67, blurb: 'Archive-driven biography short.' }),
  local('ahmed-el-shuqairy', { title: 'Ahmed El-Shuqairy', client: 'Educatly', category: 'story', format: 'vertical', duration: 63, blurb: 'Biography short.' }),
  local('ten-seconds', { title: 'Editorial Launch Video', client: '', category: 'saas', format: 'landscape', duration: 18, blurb: 'Editorial launch film built from archive footage.' }),

  // Creator content
  local('steph-kallaway', { title: 'Steph Kallaway', client: 'Steph Kallaway', category: 'creator', format: 'vertical', duration: 81, blurb: 'Personal-brand short.' }),
  local('koh-pokemon', { title: 'Why Pokémon Cards Are Worth Millions', client: 'Koh', category: 'creator', format: 'vertical', duration: 58, blurb: 'Animated explainer short.' }),
  local('dom-walls', { title: 'Dom Walls', client: 'Dom Walls', category: 'creator', format: 'vertical', duration: 41, blurb: 'Creator short.' }),
  local('conner-4m', { title: 'Conner · $4.77M', client: 'Conner', category: 'creator', format: 'vertical', duration: 94, blurb: 'Real-estate creator short.' }),
  local('cayden-dscr', { title: 'Cayden · DSCR Loans', client: 'Cayden', category: 'creator', format: 'vertical', duration: 61, blurb: 'Real-estate finance short.' }),
  local('mikey-florida-ohio', { title: 'Florida vs Ohio', client: 'Mikey', category: 'creator', format: 'vertical', duration: 21, blurb: 'Real-estate comparison short.' }),
  local('anna-pyrex', { title: 'From Pyrex to AI', client: 'Anna', category: 'creator', format: 'vertical', duration: 110, blurb: 'Business-story explainer short.' }),
  local('soudan-600egp', { title: '600 EGP Door to Door', client: 'Soudan', category: 'creator', format: 'vertical', duration: 65, blurb: 'Arabic creator short.' }),

  // Client testimonials (clients talking about working with Abdelrahman)
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
