# Claude Code migration handoff

Copy this project to a machine with Claude Code, clone the repository, then start Claude Code in the repository root. `CLAUDE.md` supplies the persistent project instructions automatically.

## One-time setup

```bash
git clone https://github.com/abdelrahmanmou/scrollmotion.git
cd scrollmotion
git checkout main
npm ci
npm run build
claude
```

Use Node 20.19+ or Node 22.12+. Authenticate GitHub CLI only on the user's machine:

```bash
gh auth login
gh auth setup-git
```

Cloudflare Pages is already connected to GitHub. No Cloudflare token is required for ordinary changes: pushing `main` starts the production deployment.

## Paste this as Claude Code's first task

```text
Read CLAUDE.md completely and inspect git status before editing. This is the Scroll Studio static Vite site. Production is https://scrollmotions.pages.dev/ and the GitHub repository is abdelrahmanmou/scrollmotion.

Preserve the current Apple avatar implementation in index.html: desktop/Android use the alpha WebM directly; Apple browsers use 3d-character-safari-alpha.mp4 through canvas. That MP4 stores RGB on the left and the original alpha mask on the right. Do not use green-screen thresholding, because it causes green rims.

For any change: make the smallest scoped edit, run npm run build, commit only intended files with a clear message, push main, then verify the Cloudflare Pages: scrollmotions check and the live site. Test avatar changes on a real iPhone/iPad as well as desktop.
```

## Deployment facts

| Item | Value |
| --- | --- |
| Production | `https://scrollmotions.pages.dev/` |
| GitHub repo | `https://github.com/abdelrahmanmou/scrollmotion` |
| Production branch | `main` |
| Cloudflare check that matters | `Cloudflare Pages: scrollmotions` |
| Latest relevant commit | `06338c1` |
| Latest homepage title | `Creative Director` |

## What was fixed most recently

Phone browsers showed green rims around the animated 3D avatar. The prior fallback chroma-keyed a green-background MP4 using a basic RGB threshold, leaving antialiased green pixels on the avatar edges.

The active fix creates and serves `assets/3d-character-safari-alpha.mp4`, which puts the transparent WebM's RGB and alpha channels side by side in an H.264 MP4. Safari/iOS draws the color half to canvas and copies alpha from the mask half. This keeps the original edge transparency while using an iOS-compatible source.

The 3D avatar needs a genuine device test after any subsequent change. The most recent production deployment was successful, but no automated desktop browser test can prove the Apple canvas path.

## Files most likely to matter

- `index.html` — headline and hero avatar canvas/player code
- `assets/3d-character-alpha.webm` — VP9 alpha desktop/Chromium source
- `assets/3d-character-safari-alpha.mp4` — Apple RGB + alpha-mask source
- `css/style.css` — visual and responsive styling
- `js/script.js` — global interactive behavior
- `vite.config.js` — multi-page build configuration
- `package.json` / `package-lock.json` — build tooling

## Known non-blocker

A second Cloudflare check named `Cloudflare Pages: scrollmotion` may fail independently. It is not the live `scrollmotions.pages.dev` project. The production verification target is exactly `Cloudflare Pages: scrollmotions`.
