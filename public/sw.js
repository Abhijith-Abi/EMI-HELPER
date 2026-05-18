const CACHE_NAME = "cash-erp-cache-v2";
const STATIC_ASSETS = [
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

// Install Service Worker — only cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("PWA: Caching static assets");
            return cache.addAll(STATIC_ASSETS);
        }),
    );
    // Activate immediately without waiting for old SW to finish
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name)),
            );
        }),
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch — network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Navigation requests (HTML pages) — always go to network first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(() => {
                // Offline fallback — return a basic offline message
                return new Response(
                    "<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>",
                    { headers: { "Content-Type": "text/html" } },
                );
            }),
        );
        return;
    }

    // Static assets — cache-first
    if (
        request.url.includes("/icons/") ||
        request.url.includes("/manifest.json") ||
        request.url.includes(".svg")
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return (
                    cached ||
                    fetch(request).then((response) => {
                        const clone = response.clone();
                        caches
                            .open(CACHE_NAME)
                            .then((cache) => cache.put(request, clone));
                        return response;
                    })
                );
            }),
        );
        return;
    }

    // Everything else — network only (API calls, JS chunks, etc.)
    event.respondWith(fetch(request));
});
