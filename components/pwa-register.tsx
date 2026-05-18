"use client";

import { useEffect } from "react";

export function PWARegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator))
            return;

        // Register the updated service worker
        navigator.serviceWorker
            .register("/sw.js", { updateViaCache: "none" })
            .then((registration) => {
                console.log("Service Worker registered:", registration.scope);
                // Force update check
                registration.update();
            })
            .catch((err) => {
                console.warn("Service Worker registration failed:", err);
            });
    }, []);

    return null;
}
