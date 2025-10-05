// Nama cache dan versi
const CACHE_NAME = 'aufant-pwa-v1';
const OFFLINE_PAGE = '/offline.html';

// Daftar file yang akan di-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/offline.html',
  '/styles.css',
  '/profile.png'
];

// Event Install - Caching aset statis
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Aktifkan service worker baru segera
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Event Activate - Membersihkan cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Kontrol semua halaman segera
      })
  );
});

// Event Fetch - Strategi Cache First
self.addEventListener('fetch', (event) => {
  // Hanya handle request GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Jika ada di cache, gunakan cache
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Jika tidak ada di cache, fetch dari network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Periksa apakah response valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response karena response hanya bisa digunakan sekali
            const responseToCache = response.clone();

            // Simpan ke cache untuk digunakan nanti
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Jika request gagal dan request adalah navigasi halaman, tampilkan offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // Untuk request lainnya, return error
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});