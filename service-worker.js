const CACHE_NAME = "calcul-filetage-vauto-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/service-worker.js" // pour se mettre à jour automatiquement
];

// --- INSTALLATION ---
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting(); // activation immédiate
});

// --- ACTIVATION ---
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key); // supprime anciens caches
        })
      )
    )
  );
  self.clients.claim();
});

// --- FETCH ---
self.addEventListener("fetch", event => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first pour fichiers critiques
  const networkFirstFiles = ["index.html", "manifest.json", "service-worker.js"];
  if (networkFirstFiles.some(f => event.request.url.endsWith(f))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first pour les autres fichiers (images, icônes, CSS)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => cachedResponse);
    })
  );
});
