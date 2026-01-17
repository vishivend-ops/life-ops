const CACHE = 'life-ops-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// Install - cache app shell
self.addEventListener('install', function(evt){
  evt.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', function(evt){
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - network first for updates, fallback to cache
self.addEventListener('fetch', function(evt){
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    fetch(evt.request).then(resp => {
      // update cache for app shell resources
      if (ASSETS.includes(new URL(evt.request.url).pathname)) {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(evt.request, copy));
      }
      return resp;
    }).catch(() => caches.match(evt.request))
  );
});