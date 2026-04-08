const CACHE_NAME = 'stellix-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event: Network-first approach with JSON fallback for API
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      
      // If it's an API call, return a JSON error instead of plain text
      if (event.request.url.includes("/api/")) {
        return new Response(JSON.stringify({ error: 'Offline', status: 503 }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
