const CACHE_NAME = "cash-erp-cache-v3";
const STATIC_ASSETS = [
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((n) => n !== CACHE_NAME)
                        .map((n) => caches.delete(n)),
                ),
            ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    // Navigation — network first with offline fallback
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(
                () =>
                    new Response(
                        "<html><body style='font-family:sans-serif;text-align:center;padding:40px'><h1>You are offline</h1><p>Reconnect to use Cash ERP.</p></body></html>",
                        { headers: { "Content-Type": "text/html" } },
                    ),
            ),
        );
        return;
    }

    // Static assets — cache first
    if (
        request.url.includes("/icons/") ||
        request.url.includes("/manifest.json") ||
        request.url.includes(".svg")
    ) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((res) => {
                        const clone = res.clone();
                        caches
                            .open(CACHE_NAME)
                            .then((c) => c.put(request, clone));
                        return res;
                    }),
            ),
        );
        return;
    }

    event.respondWith(fetch(request));
});

// Handle push notifications from FCM
self.addEventListener("push", (event) => {
    let data = { title: "Cash ERP", body: "You have a financial update." };
    try {
        if (event.data)
            data = event.data.json().notification || event.data.json();
    } catch (e) {}

    event.waitUntil(
        self.registration.showNotification(data.title || "Cash ERP", {
            body: data.body || "",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200],
            tag: data.tag || "cash-erp-notification",
            data: { url: data.url || "/dashboard" },
        }),
    );
});

// Handle notification click — focus or open the app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/dashboard";
    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    if (client.url.includes(url) && "focus" in client)
                        return client.focus();
                }
                if (self.clients.openWindow)
                    return self.clients.openWindow(url);
            }),
    );
});
