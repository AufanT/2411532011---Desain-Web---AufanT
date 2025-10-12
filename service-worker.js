const CACHE_NAME = 'aufant-pwa';
const OFFLINE_PAGE = 'offline.html';

const REPO_NAME = '/2411532011---Desain-Web---AufanT/';
const urlsToCache = [
  REPO_NAME,
  REPO_NAME + 'index.html',
  REPO_NAME + 'about.html',
  REPO_NAME + 'contact.html',
  REPO_NAME + 'offline.html',
  REPO_NAME + 'styles.css',
  REPO_NAME + 'profile.png',
  REPO_NAME + 'icon.png',
  REPO_NAME + 'icon2.png',
  REPO_NAME + 'favicon.ico'
];

// './',
//   'index.html',
//   'about.html',
//   'contact.html',
//   'offline.html',
//   'styles.css',
//   'profile.png',
//   'icon.png',
//   'icon2.png',
//   'favicon.ico'

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching offline page and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] ✅ Offline page cached successfully');
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Cache failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html');

  event.respondWith(

    fetch(event.request)
      .then((response) => {
        console.log('[Service Worker] ✅ Network success for:', event.request.url);
        return response;
      })
      .catch((error) => {
        console.log('[Service Worker] ❌ Network failed (OFFLINE):', error);
        
        if (isHTMLRequest) {
          console.log('[Service Worker] 🔄 Serving offline page');
          return caches.match(OFFLINE_PAGE)
            .then((response) => {
              if (response) {
                return response;
              }
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Offline - AufanT</title>
                    <link rel="stylesheet" href="styles.css">
                    <style>
                        .offline-container {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            text-align: center;
                            padding: 2em;
                            min-height: 70vh;
                        }

                        .offline-icon {
                            font-size: 5em;
                            margin-bottom: 0.5em;
                        }

                        .offline-container h2 {
                            color: var(--accent-color);
                            margin-bottom: 0.5em;
                        }

                        .offline-container p {
                            margin-bottom: 1em;
                            max-width: 500px;
                        }

                        .btn-retry {
                            background-color: var(--accent-color);
                            color: var(--primary-color);
                            border: none;
                            padding: 0.75em 2em;
                            border-radius: 4px;
                            font-size: 1em;
                            font-weight: bold;
                            cursor: pointer;
                            transition: background-color 0.3s ease;
                            margin-top: 1em;
                        }

                        .btn-retry:hover {
                            background-color: #7a1f22;
                        }
                    </style>
                </head>
                <body>
                    <header>
                        <h1>Offline</h1>
                        <nav>
                            <ul>
                                <li><a href="index.html">Home</a></li>
                                <li><a href="about.html">About</a></li>
                                <li><a href="contact.html">Contact</a></li>
                            </ul>
                        </nav>
                    </header>

                    <main>
                        <div class="offline-container">
                            <div class="offline-icon">📡❌</div>
                            <h2>Tidak Ada Koneksi Internet</h2>
                            <p>Maaf, sepertinya Anda sedang offline. Halaman ini memerlukan koneksi internet untuk dimuat.</p>
                            <p>Silakan periksa koneksi internet Anda dan coba lagi.</p>
                            <button class="btn-retry" onclick="window.location.reload()">Coba Lagi</button>
                        </div>
                    </main>

                    <footer>
                        <p>&copy; 2025 Aufan Taufiqurrahman</p>
                    </footer>
                </body>
                </html>`, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        }
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] 📦 Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});