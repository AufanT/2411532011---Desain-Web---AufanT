const CACHE_NAME = 'aufant-pwa-v3';
const OFFLINE_PAGE = 'offline.html';

const urlsToCache = [
  './',
  'index.html',
  'about.html',
  'contact.html',
  'offline.html',
  'styles.css',
  'profile.png',
  'icon.png',
  'icon2.png',
  'favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Jika response sukses, gunakan itu
          if (response.ok) {
            return response;
          }
          // Jika response adalah 404 atau error server lainnya, tampilkan halaman offline
          return caches.match(OFFLINE_PAGE);
        })
        .catch(() => {
          // Jika fetch gagal total (tidak ada koneksi), tampilkan halaman offline
          return caches.match(OFFLINE_PAGE);
        })
    );
  } else {
    // Untuk aset lain (CSS, gambar), gunakan strategi Cache First
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request);
        })
    );
  }
});