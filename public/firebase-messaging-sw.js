// Firebase Cloud Messaging service worker (background push).
// Replace FIREBASE_CONFIG with your project config from Firebase Console > Project settings.
// Generate a Web Push certificate (VAPID key) under Cloud Messaging > Web Push certificates.

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyBITeWsSZ_0HXFLYie_Ztqq2GNIWk78J7E",
  authDomain: "ride-83bc9.firebaseapp.com",
  projectId: "ride-83bc9",
  storageBucket: "ride-83bc9.firebasestorage.app",
  messagingSenderId: "527859671961",
  appId: "1:527859671961:web:690e9d9a0a5133f813a908",
  measurementId: "G-H9BQELZQZ2"
};

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
