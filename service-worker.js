const CACHE_NAME = 'breathen-cache-v6';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './assets/softbeep.mp3',
  './assets/softbeep_inhale.mp3',
  './assets/softbeep_hold.mp3',
  './assets/softbeep_exhale.mp3',
  './assets/inhale.mp3',
  './assets/hold.mp3',
  './assets/exhale.mp3',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available with network fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Try to get the resource from the network first (for fresh content)
        return fetch(event.request)
          .then(networkResponse => {
            // If we got a valid response, cache it for next time
            if (networkResponse && networkResponse.status === 200 && 
                (networkResponse.type === 'basic' || event.request.url.includes('cdnjs'))) {
              
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If network fails, return the cached version or a fallback
            return cachedResponse || 
                  // If it's an image, you could return a default image
                  (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/) ? 
                    caches.match('./icons/icon-192x192.png') : 
                    new Response('Offline content not available', { 
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: new Headers({
                        'Content-Type': 'text/plain'
                      })
                    })
                  );
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
