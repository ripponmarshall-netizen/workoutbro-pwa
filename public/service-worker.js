/* WorkoutBro service worker.
   Pages: network-first with a 3 s timeout (weak gym signal falls back to cache).
   Assets & fonts: cache-first (Vite asset names are content-hashed).
   Bump CACHE to force-clear old caches. */
const CACHE = 'workoutbro-hunter-v2';
const SHELL = ['./', './manifest.webmanifest', './icon.svg', './icon-192.png'];
const NAV_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function networkFirstPage(req) {
  const network = fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('./', copy));
    }
    return res;
  });
  const timeout = new Promise((resolve) => {
    setTimeout(() => caches.match('./').then((hit) => hit && resolve(hit)), NAV_TIMEOUT_MS);
  });
  return Promise.race([network.catch(() => caches.match('./')), timeout]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
    return;
  }

  const cacheable = url.origin === self.location.origin
    || url.hostname === 'fonts.googleapis.com'
    || url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});
