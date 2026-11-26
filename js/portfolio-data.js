// Built-in portfolio catalogue — the fallback list.
//
// The live list is managed in the CMS at /admin (see CLAUDE.md). This file is
// used when the CMS has no list yet and by `npm run dev`.
//
// Each video has a stable `slug`. Slugs are used in share links such as
//   /portfolio.html?show=azza-fahmy,hub-xyz
// so never rename a slug once a link has been sent. Add new videos in the CMS.

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

// Files in the R2 bucket (moved there from the website code)
const R2 = {
  'yozo-anas': ['yozo-anas-mwxopzwn.mp4', 'yozo-anas-mwxoq0i2.jpg'],
  'yozo-retention': ['yozo-retention-mwxoq0v6.mp4', 'yozo-retention-mwxoq1mp.jpg'],
  'yozo-shopify-listing': ['yozo-shopify-listing-mwxoq1xx.mp4', 'yozo-shopify-listing-mwxoq2fl.jpg'],
  'yozo-onboarding': ['yozo-onboarding-mwxoq2sq.mp4', 'yozo-onboarding-mwxoq3e0.jpg'],
  'yozo-order-confirmation': ['yozo-order-confirmation-mwxoq4q9.mp4', 'yozo-order-confirmation-mwxoq535.jpg'],
  'yozo-zena-ai': ['yozo-zena-ai-mwxoq5oz.mp4', 'yozo-zena-ai-mwxoq634.jpg'],
  'yozo-abandoned-carts': ['yozo-abandoned-carts-mwxoq6d2.mp4', 'yozo-abandoned-carts-mwxoq6pz.jpg'],
  'yozo-promo-square': ['yozo-promo-square-mwxoq6zj.mp4', 'yozo-promo-square-mwxoq7cn.jpg'],
  'boardworks-explainer': ['boardworks-explainer-mwxoq818.mp4', 'boardworks-explainer-mwxoq8fm.jpg'],
  'hub-xyz': ['hub-xyz-mwxoq9rf.mp4', 'hub-xyz-mwxoqa6c.jpg'],
  'cryptex': ['cryptex-mwxoqc9k.mp4', 'cryptex-mwxoqcou.jpg'],
  'blackbox-elevenlabs': ['blackbox-elevenlabs-mwxoqf7r.mp4', 'blackbox-elevenlabs-mwxoqfsw.jpg'],
  'searchable': ['searchable-mwxoqiim.mp4', 'searchable-mwxoqj66.jpg'],
  'yozo-testimonials': ['yozo-testimonials-mwxoqkp8.mp4', 'yozo-testimonials-mwxoqlbr.jpg'],
  'yozo-ai-ugc': ['yozo-ai-ugc-mwxoqmne.mp4', 'yozo-ai-ugc-mwxoqn3w.jpg'],
  'time-is-money': ['time-is-money-mwxoqouk.mp4', 'time-is-money-mwxoqp7b.jpg'],
  'so-by-sora-launch': ['so-by-sora-launch-mwxoqq30.mp4', 'so-by-sora-launch-mwxoqqh1.jpg'],
  'sora-collection-what-stays': ['sora-collection-what-stays-mwxoqrfm.mp4', 'sora-collection-what-stays-mwxoqruw.jpg'],
  'sora-jameel': ['sora-jameel-mwxoqswe.mp4', 'sora-jameel-mwxoqtc2.jpg'],
  'bayt-zayn-branding': ['bayt-zayn-branding-mwxoqug8.mp4', 'bayt-zayn-branding-mwxoqurh.jpg'],
  'andaa-brand-story': ['andaa-brand-story-mwxoqw82.mp4', 'andaa-brand-story-mwxoqwns.jpg'],
  'society-website': ['society-website-mwxoqxnv.mp4', 'society-website-mwxoqy0q.jpg'],
  'workwise-marketing-strategy': ['workwise-marketing-strategy-mwxoqz4y.mp4', 'workwise-marketing-strategy-mwxoqzn7.jpg'],
  'workwise-about': ['workwise-about-mwxor0za.mp4', 'workwise-about-mwxor1ft.jpg'],
  'workwise-our-work': ['workwise-our-work-mwxor2g6.mp4', 'workwise-our-work-mwxor2uo.jpg'],
  'workwise-3-second-audition': ['workwise-3-second-audition-mwxor48r.mp4', 'workwise-3-second-audition-mwxor4lz.jpg'],
  'unicafone': ['unicafone-mwxor5vr.mp4', 'unicafone-mwxor68u.jpg'],
  'educatly-ad': ['educatly-ad-mwxor81i.mp4', 'educatly-ad-mwxor8kf.jpg'],
  'goldsand': ['goldsand-mwxor8wg.mp4', 'goldsand-mwxor9q9.jpg'],
  'azza-fahmy': ['azza-fahmy-mwxorb82.mp4', 'azza-fahmy-mwxorbyk.jpg'],
  'mostafa-mosharrafa': ['mostafa-mosharrafa-mwxorela.mp4', 'mostafa-mosharrafa-mwxorf2p.jpg'],
  'ahmed-el-shuqairy': ['ahmed-el-shuqairy-mwxorg7v.mp4', 'ahmed-el-shuqairy-mwxorgmp.jpg'],
  'ten-seconds': ['ten-seconds-mwxorhxa.mp4', 'ten-seconds-mwxorib4.jpg'],
  'steph-kallaway': ['steph-kallaway-mwxorip1.mp4', 'steph-kallaway-mwxorjuc.jpg'],
  'koh-pokemon': ['koh-pokemon-mwxork5x.mp4', 'koh-pokemon-mwxorknk.jpg'],
  'dom-walls': ['dom-walls-mwxormiv.mp4', 'dom-walls-mwxormz0.jpg'],
  'conner-4m': ['conner-4m-mwxorpeu.mp4', 'conner-4m-mwxorq3o.jpg'],
  'cayden-dscr': ['cayden-dscr-mwxorqdm.mp4', 'cayden-dscr-mwxorqst.jpg'],
  'mikey-florida-ohio': ['mikey-florida-ohio-mwxorrve.mp4', 'mikey-florida-ohio-mwxorsde.jpg'],
  'anna-pyrex': ['anna-pyrex-mwxorucq.mp4', 'anna-pyrex-mwxorv16.jpg'],
  'soudan-600egp': ['soudan-600egp-mwxorx2f.mp4', 'soudan-600egp-mwxorxl9.jpg'],
  'alex-saint': ['alex-saint-mwxorzgd.mp4', 'alex-saint-mwxos010.jpg'],
  'dean': ['dean-mwxos09m.mp4', 'dean-mwxos0mo.jpg'],
  'reel-1': ['reel-1-mwxos0zv.mp4', 'reel-1-mwxos19x.jpg'],
  'reel-2': ['reel-2-mwxos1k8.mp4', 'reel-2-mwxos1wp.jpg'],
  'reel-3': ['reel-3-mwxos2rm.mp4', 'reel-3-mwxos31l.jpg'],
  'reel-4': ['reel-4-mwxos3be.mp4', 'reel-4-mwxos3py.jpg'],
  'reel-5': ['reel-5-mwxos3zs.mp4', 'reel-5-mwxos4bd.jpg'],
  'reel-6': ['reel-6-mwxos4m8.mp4', 'reel-6-mwxos4xh.jpg'],
  'reel-7': ['reel-7-mwxos56a.mp4', 'reel-7-mwxos5ff.jpg'],
  'reel-8': ['reel-8-mwxos6d4.mp4', 'reel-8-mwxos6wk.jpg'],
  'reel-9': ['reel-9-mwxos76n.mp4', 'reel-9-mwxos7g3.jpg'],
  'reel-10': ['reel-10-mwxos7pm.mp4', 'reel-10-mwxos847.jpg'],
  'reel-11': ['reel-11-mwxos8ei.mp4', 'reel-11-mwxos8y2.jpg'],
  'reel-12': ['reel-12-mwxos974.mp4', 'reel-12-mwxos9ic.jpg'],
  'reel-13': ['reel-13-mwxosagk.mp4', 'reel-13-mwxosazd.jpg'],
  'reel-14': ['reel-14-mwxosb7x.mp4', 'reel-14-mwxosbkx.jpg'],
  'reel-15': ['reel-15-mwxosbv6.mp4', 'reel-15-mwxosc5s.jpg'],
  'reel-16': ['reel-16-mwxosceq.mp4', 'reel-16-mwxoscnh.jpg'],
  'reel-17': ['reel-17-mwxoscwk.mp4', 'reel-17-mwxosd7b.jpg'],
  'reel-18': ['reel-18-mwxose1x.mp4', 'reel-18-mwxosec3.jpg'],
  'reel-19': ['reel-19-mwxosem7.mp4', 'reel-19-mwxosf0g.jpg'],
};

const local = (slug, extra) => ({
  slug,
  src: `/media/videos/${R2[slug][0]}`,
  poster: `/media/posters/${R2[slug][1]}`,
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
  src: `/media/videos/${R2[`reel-${n}`][0]}`,
  poster: `/media/posters/${R2[`reel-${n}`][1]}`,
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
