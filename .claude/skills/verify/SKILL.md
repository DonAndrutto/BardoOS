---
name: verify
description: Build-free runtime verification recipe for Bardo OS — serve the static PWA locally and drive it with Playwright/Chromium.
---

# Verifying Bardo OS changes

There is no build: what is in the repo is what ships. Verification is
serving the directory and driving a real browser.

## Serve

```bash
python3 -m http.server 8321 -d /path/to/BardoOS &
```

## Drive

Playwright (npm package only, browsers pre-installed on the runner):

```bash
npm install playwright   # in a scratch dir, not the repo
```

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({
  // the runner pre-installs Chromium here; do NOT run `playwright install`
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
```

If that path is stale, `find /opt/pw-browsers -maxdepth 3 -name chrome`.

## Gotchas

- **Screenshot latency drifts animation sampling.** To capture a frame
  of a timed animation (e.g. the intro veil) at time T, anchor on the
  page's own clock, not cumulative `waitForTimeout`:
  `await page.waitForFunction((t) => performance.now() >= t, T)`.
- The intro veil (`#intro`, js/intro.js) removes itself; wait for
  `page.waitForSelector('#intro', { state: 'detached' })` before
  interacting with the app. It also skips on any pointerdown/keydown
  and under `reducedMotion: 'reduce'`.
- CI is only `node scripts/validate.mjs` (content schema); run it before
  pushing content changes.
- Service worker: any change to app files or content requires bumping
  `VERSION` in sw.js, or returning readers keep the old cache.

## Flows worth driving

- First load: intro veil plays ~4.8s, detaches, first text renders in
  `#reader`.
- Tap/key during intro skips it (detaches within ~1s).
- The bottom-bar toggles (TIB/PHO/ENG, voice mode, theme) re-render the
  reader without losing scroll position.
