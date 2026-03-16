// Firebase Cloud Messaging service worker (background push).
// Config must match your Firebase project. Do not commit real keys in production.

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

const DEFAULT_ICON =
  "https://res.cloudinary.com/dx0tk0a56/image/upload/v1773498043/ChatGPT_Image_Mar_14__2026__07_43_04_PM-removebg-preview_jhsapl.png";

const firebaseConfig = {
  apiKey: "AIzaSyClSELcZe1BVkfv5FvVqPZUOhJposY1Mrc",
  authDomain: "ride-dev-c73f1.firebaseapp.com",
  projectId: "ride-dev-c73f1",
  storageBucket: "ride-dev-c73f1.firebasestorage.app",
  messagingSenderId: "572434196141",
  appId: "1:572434196141:web:a5ae0155134d2990efc824",
  measurementId: "G-X30H45ND2W",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const n = payload.notification || {};
  const data = payload.data || {};
  const title = n.title || data.title || "Notification";
  const body = n.body || data.body || "";
  const icon = n.icon || n.image || data.icon || DEFAULT_ICON;
  return self.registration.showNotification(title, {
    body,
    icon,
    badge: n.badge || icon,
    tag: data.tag || "fcm-default",
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/dashboard", payload: data },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const client = clientList[0];
      if (client?.navigate) {
        client.navigate(url);
        return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
