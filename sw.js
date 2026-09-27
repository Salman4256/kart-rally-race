// Turbo Kart Rally — Service Worker for offline play & fast caching
const CACHE_NAME = 'turbokart-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './src/styles.css',
  './src/main.js',
  './src/config.js',
  './src/events.js',
  './src/audio.js',
  './src/camera.js',
  './src/kart.js',
  './src/models.js',
  './src/track.js',
  './src/tracks.js',
  './src/track-textures.js',
  './src/items.js',
  './src/ai.js',
  './src/effects.js',
  './src/environment.js',
  './src/race.js',
  './src/menu.js',
  './src/hud.js',
  './src/input.js',
  './src/customization.js',
  './src/grandprix.js',
  './src/ghost.js',
  './src/touch.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
