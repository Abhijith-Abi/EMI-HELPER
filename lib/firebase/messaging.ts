import { messaging } from "./config";
import { ref, set } from "firebase/database";
import { rtdb } from "./config";
import { toast } from "sonner";

const VAPID_KEY =
    "BBVRh_MzjMIJGyKrPNxhOMjErfoyHAdTCsluHKHbfMiuLBaHlAkjisK_9wmt0mtLWZH4M872KLbW8qx8UuHpJsA";

/**
 * Requests browser push notification permissions and registers the FCM token
 * directly to Firebase Realtime Database (client-side, respects auth rules)
 */
export async function requestNotificationPermissionAndRegisterToken(
    userId: string,
) {
    if (typeof window === "undefined" || !userId) return;

    const cachedToken = localStorage.getItem(`fcm_token_${userId}`);
    if (cachedToken) return;

    if (!("Notification" in window)) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            if (!messaging) {
                console.info(
                    "FCM not available. Native notifications enabled.",
                );
                return;
            }

            const { getToken } = await import("firebase/messaging");
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            });

            if (currentToken && rtdb) {
                // Write token directly using client SDK (auth rules apply)
                const tokenRef = ref(rtdb, `users/${userId}/fcmToken`);
                await set(tokenRef, currentToken);
                localStorage.setItem(`fcm_token_${userId}`, currentToken);
                console.log("FCM Token registered successfully");
            }
        }
    } catch (error) {
        // Silently fail — FCM is optional, don't block the app
        console.warn("FCM token registration skipped:", error);
    }
}

/**
 * Scans all unpaid EMIs due within 3 days and triggers notifications.
 * Uses the service worker for mobile/PWA reliability, de-dupes per day.
 */
export function triggerLocalDueNotifications(emis: any[]) {
    if (typeof window === "undefined" || emis.length === 0) return;
    if (!("Notification" in window) || Notification.permission !== "granted")
        return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifiedKey = `notified_${today.toISOString().split("T")[0]}`;
    let notified: string[] = [];
    try {
        notified = JSON.parse(localStorage.getItem(notifiedKey) || "[]");
    } catch {}

    emis.forEach((emi) => {
        if (emi.status !== "Active") return;

        const dueDate = new Date(emi.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (
            daysRemaining >= 0 &&
            daysRemaining <= 3 &&
            !notified.includes(emi.id)
        ) {
            const title =
                daysRemaining === 0
                    ? `🚨 EMI Due TODAY: ${emi.title}`
                    : `⏰ EMI Due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}: ${emi.title}`;
            const body = `₹${emi.emi_amount.toLocaleString()} is due on ${emi.due_date}. Don't miss it!`;

            const show = (reg?: ServiceWorkerRegistration) => {
                try {
                    if (reg) {
                        reg.showNotification(title, {
                            body,
                            icon: "/icons/icon-192x192.png",
                            badge: "/icons/icon-192x192.png",
                            tag: `emi-due-${emi.id}`,
                            data: { url: "/dashboard" },
                        } as NotificationOptions);
                    } else {
                        const n = new Notification(title, {
                            body,
                            icon: "/icons/icon-192x192.png",
                            tag: `emi-due-${emi.id}`,
                        });
                        n.onclick = () => {
                            window.focus();
                            n.close();
                        };
                    }
                    notified.push(emi.id);
                    localStorage.setItem(notifiedKey, JSON.stringify(notified));
                } catch (err) {
                    console.error("Failed to display notification:", err);
                }
            };

            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.ready.then(show).catch(() => show());
            } else {
                show();
            }
        }
    });
}
