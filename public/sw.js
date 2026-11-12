const CACHE_NAME = 'perspectivefix-shell-v1';
const APP_ROOT = new URL('./', self.registration.scope);
const APP_SHELL = [
  APP_ROOT.href,
  new URL('site.webmanifest', APP_ROOT).href,
  new URL('favicon-192.png', APP_ROOT).href,
  new URL('favicon-512.png', APP_ROOT).href,
  new URL('perspectivefix-mark.svg', APP_ROOT).href,
];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  const page = await cache.match(APP_ROOT.href);
  if (!page) throw new Error('PerspectiveFix app shell was not cached.');

  const html = await page.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
    .map((match) => new URL(match[1], APP_ROOT))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);
  await cache.addAll([...new Set(assets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheAppShell().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('perspectivefix-shell-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT.href, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(APP_ROOT.href);
          return cachedPage || Response.error();
        })
    );
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
