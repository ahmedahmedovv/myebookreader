const CACHE_NAME = 'epub-reader-v1';
const RUNTIME_CACHE = 'epub-reader-runtime-v1';
const API_CACHE = 'epub-reader-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { mode: 'no-cors' }))).catch(err => {
        console.warn('[Service Worker] Failed to cache some assets:', err);
        // Cache what we can
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(new Request(url, { mode: 'no-cors' })).catch(e => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, e);
            })
          )
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (Mistral API)
  if (url.hostname === 'api.mistral.ai') {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and app shell
  if (url.origin === location.origin || 
      url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cached response is still valid (24 hours)
    const cachedDate = cachedResponse.headers.get('sw-cached-date');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      // If no date header, return cached response anyway
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone the response and add cache date
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
      return networkResponse;
    }
    return networkResponse;
  } catch (error) {
    // Network failed, return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline response for API
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are offline and no cached response is available.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If it's the main page and we're offline, return cached version
    if (request.url === location.origin + '/' || 
        request.url === location.origin + '/index.html') {
      const cachedIndex = await cache.match('/index.html') || await cache.match('/');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    throw error;
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_EPUB') {
    const { epubData, fileName } = event.data;
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.put(`epub:${fileName}`, new Response(epubData));
      })
    );
  }
});

