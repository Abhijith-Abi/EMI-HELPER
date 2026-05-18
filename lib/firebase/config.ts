import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import {
    getAnalytics,
    isSupported as isAnalyticsSupported,
} from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyClODidjLZ2zp5qsZS7ztJ_uIjIwCQr1f4",
    authDomain: "emi-analyzer.firebaseapp.com",
    databaseURL: "https://emi-analyzer-default-rtdb.firebaseio.com",
    projectId: "emi-analyzer",
    storageBucket: "emi-analyzer.firebasestorage.app",
    messagingSenderId: "1095185913627",
    appId: "1:1095185913627:web:bbe19959894d5c9f2ea5be",
    measurementId: "G-4N8W4JSXSC",
};

// Always configured since credentials are fully integrated
export const isFirebaseConfigured = true;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics properly with a browser-environment safe check
let analytics: any = null;
if (typeof window !== "undefined") {
    isAnalyticsSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

// Initialize Messaging dynamically on the client side only
let messaging: any = null;
if (typeof window !== "undefined") {
    import("firebase/messaging")
        .then(({ getMessaging, isSupported }) => {
            isSupported().then((supported) => {
                if (supported) {
                    messaging = getMessaging(app);
                }
            });
        })
        .catch((err) =>
            console.warn("Failed to load Firebase Messaging SDK:", err),
        );
}

export { app, auth, db, rtdb, googleProvider, analytics, messaging };
