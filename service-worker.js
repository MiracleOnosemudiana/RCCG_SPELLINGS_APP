const CACHE_NAME = "spelling-quiz-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/quiz.html",
    "/admin-login.html",
    "/admin-dashboard.html",
    "/results.html",
    "/style.css",
    "/script.js",
    "/assets/images/watermark.png"
];

// Install Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Caching files...");
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Fetch from network first, then cache
self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
        .then(response => {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response.clone());
                return response;
            });
        })
        .catch(() => caches.match(event.request)) // Serve from cache if offline
    );
});

// Activate & Delete Old Cache
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});
