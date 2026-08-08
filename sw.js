// Bardo OS service worker — cache-first, precache everything.
// The app must work offline permanently after the first visit.
//
// VERSION discipline: bump this string with any change to app files or
// content, or readers keep the old cache (docs/content-entry.md, step 8).
const VERSION = 'bardo-os-v23';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/app.css',
  'css/intro.css',
  'js/app.js',
  'js/intro.js',
  'js/data.js',
  'js/home.js',
  'js/i18n.js',
  'js/install.js',
  'js/render.js',
  'js/scroll.js',
  'js/store.js',
  'js/trail.js',
  'assets/icons/favicon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/intro/mandala.webp',
  'assets/deities/MANIFEST.json',
  'assets/fonts/jomolhari/Jomolhari-Regular.ttf',
  'assets/fonts/eb-garamond/EBGaramond[wght].ttf',
  'assets/fonts/eb-garamond/EBGaramond-Italic[wght].ttf',
  'assets/fonts/inter/Inter[opsz,wght].ttf',
  'content/cycle.json',
  // Every translated text — offline must not depend on what the
  // reader happened to open while they still had a connection.
  'content/texts/bardo-thodrol.becoming-intro.json',
  'content/texts/bardo-thodrol.dharmata-intro.json',
  'content/texts/bardo-thodrol.dying-intro.json',
  'content/texts/bardo-thodrol.wrathful-elucidation.json',
  'content/texts/guide.how-to-use.json',
  'content/texts/guide.introduction.json',
  'content/texts/ngotro.virtue-and-vice.json',
  'content/texts/prayer.calling-buddhas-for-aid.json',
  'content/texts/prayer.deliverance-perilous-straits.json',
  'content/texts/prayer.protection-from-fear.json',
  'content/texts/prayer.root-verses-six-bardos.json',
];

// Deity images are not listed above: the manifest already names them,
// and a second list would be one more thing to forget. Whatever it
// names is precached alongside the shell, one by one — a missing or
// unreadable image must never fail the whole install (BRIEF §7).
async function precacheDeityImages(cache) {
  try {
    const res = await fetch('assets/deities/MANIFEST.json', { cache: 'no-store' });
    if (!res.ok) return;
    const manifest = await res.json();
    const images = [...new Set((manifest.collections || [])
      .flatMap((c) => c.depictions || [])
      .map((d) => d && d.image)
      .filter(Boolean))];
    await Promise.allSettled(images.map((url) => cache.add(url)));
  } catch {
    // No manifest, or no images yet. The texts work offline regardless.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(PRECACHE);
    await precacheDeityImages(cache);
    await self.skipWaiting();
  })());
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
