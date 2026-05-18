// Import and configure the Firebase SDK inside the service worker
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js")

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClODidjLZ2zp5qsZS7ztJ_uIjIwCQr1f4",
  authDomain: "emi-analyzer.firebaseapp.com",
  projectId: "emi-analyzer",
  storageBucket: "emi-analyzer.firebasestorage.app",
  messagingSenderId: "1095185913627",
  appId: "1:1095185913627:web:bbe19959894d5c9f2ea5be"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Retrieve Firebase Messaging
const messaging = firebase.messaging()

// Customize background message handling
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message: ", payload)
  
  const notificationTitle = payload.notification?.title || "EMI Due Alert!"
  const notificationOptions = {
    body: payload.notification?.body || "An EMI payment requires your attention.",
    icon: "/favicon.ico"
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
