# Scrollmotion / Scroll Studio

## Project purpose

Personal site of Abdelrahman Moustafa — Creative Director (video editor / motion designer), based in Cairo, working remotely with clients worldwide. Write all copy in the first person ("I", "my"), not as an agency. "Scroll Studio" is the old brand name; don't reintroduce it. Booking links go to https://calendly.com/abdomoustafaib/30min (there is no on-page contact section). City pages under `locations/` describe remote work for clients in those cities; don't add local-business addresses for cities he isn't in.

- Repository: `https://github.com/abdelrahmanmou/scrollmotion`
- Production site: `https://scrollmotions.pages.dev/`
- Hosting: Cloudflare Pages, connected to `main`
- Build output: `dist/`
- Stack: static HTML/CSS/vanilla JavaScript built with Vite 7

## Start here

```bash
npm ci
npm run dev
npm run build
```

Use Node 20.19+ or Node 22.12+; Vite 7 requires it. `vite.config.js` discovers every HTML file recursively so all pages are Vite build entries.

Do not commit `dist/` or `node_modules/`.

## Repository layout

- `index.html`: homepage and hero avatar logic
- `css/style.css`: global styles and responsive rules
- `js/script.js`: progressive enhancement, GSAP and Lenis integrations
- `assets/`: homepage media, including the avatar formats
- `portfolio.html`, `case-studies.html`, `services/`, `industries/`, `locations/`, `articles/`, `blog/`: static site pages
- `vite.config.js`: multi-page Vite build configuration

## Portfolio CMS (/admin)

The portfolio video list is managed at `https://scrollmotions.pages.dev/admin`.

- Storage: Cloudflare R2 bucket `scrollmotions-media`, bound to the Pages project as `MEDIA`. It holds `catalog.json` (the list), `catalog-history/` (last 40 versions), and uploads under `media/videos/` and `media/posters/`.
- Login: the `ADMIN_PASSWORD` secret in Cloudflare Pages → Settings → Variables and secrets. Changing it signs everyone out.
- Server code: `functions/` (Pages Functions). `public/_routes.json` limits Functions to `/api/*` and `/media/*` so static pages don't use Function requests.
  - `GET /api/catalog` public list; `GET /media/*` streams R2 files with Range support.
  - `/api/admin/*` login, catalogue save (etag-checked), multipart upload, media delete.
- Front end: `admin/index.html`, `js/admin.js`, `css/admin.css`. `js/portfolio.js` loads the list via `js/portfolio-catalog.js` and falls back to the built-in `js/portfolio-data.js` (used by `npm run dev`, which has no Functions).
- Once the CMS has saved, `js/portfolio-data.js` is only the fallback; edit videos in the CMS, not in that file.
- All portfolio videos and thumbnails live in R2 (moved from `public/` on 2026-11-26; the old files remain in Git history). Don't add video files to the repo; upload through the CMS. `case-studies.html` also plays two videos from `/media/`. Only the hero avatar files stay in `assets/`.
- Slugs are permanent: share links use `?show=slug-a,slug-b`.
- Local test with Functions: `npm run build`, then `npx wrangler pages dev dist --r2 MEDIA` with `ADMIN_PASSWORD=…` in `.dev.vars` (git-ignored).
- Share-link tracking: D1 database `scrollmotions-analytics` bound as `DB`. `js/share-tracking.js` (loaded by `js/portfolio.js`) sends beacons to `POST /api/track` only on `?show=` pages: an `open` on load and `watch` updates (seconds watched per video). Visits from a signed-in admin are ignored. A link is identified by its normalised `show` list plus optional `ref` (`&ref=client-name`, added by the admin's client-name field), so links sent before tracking are still matched. Tables (`links`, `visits`, `plays`) are created by `functions/_lib/track.js`. Admin view: Links tab via `/api/admin/links`. Local test: add `--d1 DB=local-analytics` to `wrangler pages dev`.
- Personal links: each tracked link has `label` (client name), `greet` (show the name) and `note`. `GET /api/link` gives the page "For {name}" and the note; `functions/portfolio.js` rewrites title/og/twitter tags on `/portfolio?show=…` so WhatsApp/LinkedIn/email previews show the first picked video's thumbnail, the client's name and the note (and `noindex`). `_routes.json` includes `/portfolio` for this.
- Telegram alerts: secret `TELEGRAM_BOT_TOKEN`; the chat is connected from the admin Links tab (stored in D1 `settings`). `POST /api/track` sends an alert on a new visit (not for the same person within 30 minutes).
- Site URLs use `https://scrollmotions.pages.dev` (no custom domain; `scrollmotion.site` was dropped on 2026-11-26).
- Deploy hook `main-rebuild` (Settings → Builds) rebuilds `main` if a GitHub push doesn't trigger a build.

## Current hero avatar implementation

The hero uses a video with transparency. Keep the three related assets and the browser routing intact:

| Target browsers | Source / behavior |
| --- | --- |
| Chrome and Firefox desktop/Android | `assets/3d-character-alpha.webm`, rendered directly with its VP9 alpha channel |
| iPhone, iPad, Safari | `assets/3d-character-safari-alpha.mp4`, rendered through a canvas |

`3d-character-safari-alpha.mp4` contains two equal-width panels: the left panel is color and the right panel is the original alpha mask. The canvas code in `index.html` reconstructs transparency from that mask. This superseded the old green-screen fallback because threshold keying produced green rims around antialiased edges.

When changing this system:

1. Preserve `autoplay`, `loop`, `muted`, and `playsinline` on the hidden source video.
2. Preserve iOS/iPadOS detection, including iPad desktop mode: `navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1`.
3. Do not restore green-screen thresholding; it causes visible fringing.
4. Test a real iPhone or iPad after deployment. Desktop Chromium does not exercise the Apple canvas path.
5. Keep the canvas work bounded at its existing reduced resolution for mobile performance.

The current headline in `index.html` is **Creative Director**.

## Deployment workflow

Cloudflare Pages deploys after a push to `main`.

```bash
git status
npm run build
git add <intended files>
git commit -m "<clear message>"
git push origin main
```

Verify the `Cloudflare Pages: scrollmotions` check for the pushed commit. There is also a distinct Cloudflare project/check called `scrollmotion` that has failed in the past; it is not the production Pages site above. Do not treat that failure as a failed deployment of `scrollmotions.pages.dev` unless the `scrollmotions` check itself fails.

After deployment, hard refresh the live site and confirm the changed markup/assets are served. For hero/avatar work, validate both desktop and real iOS Safari/Chrome.

## Recent context

- `06338c1` — Replaced Apple green-screen keying with color + original-alpha-mask MP4. The deployment to `scrollmotions.pages.dev` succeeded.
- `7da8f67` — Changed the hero headline to “Creative Director” and made Apple fallback selection explicit.
- `a5e0686` / `a71c2b6` — Earlier Safari canvas work; useful history but superseded by `06338c1` for edge transparency.

## Working conventions

- Prefer small, focused edits. This is a static multi-page site; a change to shared CSS or JS can affect many pages.
- Preserve existing user changes and inspect `git status` before writing.
- Use `rg` to locate content before broad replacement.
- Build before push. Build warnings about legacy non-module scripts on content pages currently exist; only investigate when they affect the requested page or create a build failure.
- Do not expose or commit secrets, tokens, deployment credentials, or user contact data.
