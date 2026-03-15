"use strict"

const fs = require("fs")
const path = require("path")

// Load .env and .env.local from project root so build/dev have Firebase config
const root = process.cwd()
try {
  const dotenv = require("dotenv")
  dotenv.config({ path: path.join(root, ".env") })
  dotenv.config({ path: path.join(root, ".env.local") }) // Next.js dev often uses .env.local
} catch {
  // dotenv optional; in CI env vars are usually set directly
}

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
      : ""),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`
      : ""),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
}

const outPath = path.join(process.cwd(), "public", "firebase-messaging-sw.js")
const content = `// Firebase Cloud Messaging service worker (background push).
// Generated at build time from env (NEXT_PUBLIC_FIREBASE_*). Do not commit real keys.
// Generate a Web Push certificate (VAPID key) under Cloud Messaging > Web Push certificates.

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

var FIREBASE_CONFIG = ${JSON.stringify(config)};

firebase.initializeApp(FIREBASE_CONFIG);
var messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var n = payload.notification || {};
  var title = n.title || "Notification";
  var iconUrl = n.icon || "/icon-192.png";
  var options = {
    body: n.body || "",
    icon: iconUrl,
    badge: n.badge || iconUrl,
    tag: (payload.data && payload.data.tag) || "default",
  };
  return self.registration.showNotification(title, options);
});
`

fs.writeFileSync(outPath, content, "utf8")
console.log("Generated public/firebase-messaging-sw.js from env")
