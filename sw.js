// Bardo OS service worker — cache-first, precache everything.
// The app must work offline permanently after the first visit.
//
// VERSION discipline: bump this string with any change to app files or
// content, or readers keep the old cache (docs/content-entry.md, step 8).
const VERSION = 'bardo-os-v2';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'js/render.js',
  'assets/icon.svg',
  'assets/fonts/jomolhari/Jomolhari-Regular.ttf',
  'assets/fonts/eb-garamond/EBGaramond[wght].ttf',
  'assets/fonts/eb-garamond/EBGaramond-Italic[wght].ttf',
  'assets/fonts/inter/Inter[opsz,wght].ttf',
  'content/cycle.json',
  'content/texts/bardo-thodrol.dying-intro.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first; anything fetched at runtime (e.g. a text JSON not yet in
// the precache list) is cached on first use so it survives offline too.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline navigation falls back to the shell.
        if (req.mode === 'navigate') return caches.match('./');
        throw new Error('offline and not cached');
      });
    })
  );
});
