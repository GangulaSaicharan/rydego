// Firebase Cloud Messaging service worker (background push).
// Generated at build time from env (NEXT_PUBLIC_FIREBASE_*). Do not commit real keys.
// Generate a Web Push certificate (VAPID key) under Cloud Messaging > Web Push certificates.

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

var FIREBASE_CONFIG = {"apiKey":"AIzaSyBeT73eXSbm9IP2F2u8tZE9q9it08Z5hc8","authDomain":"ride-bd756.firebaseapp.com","projectId":"ride-bd756","storageBucket":"ride-bd756.firebasestorage.app","messagingSenderId":"707888878057","appId":"1:707888878057:web:51c56eb0da2e18799d3b78","measurementId":"G-RX6VTV59S4"};

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
