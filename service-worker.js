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
    "/assets/images/watermark.png" // Add all assets needed
];

// Install Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch from cache when offline
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
