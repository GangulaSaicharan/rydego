// Firebase Cloud Messaging service worker (background push).
// Config must match your Firebase project. Do not commit real keys in production.

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

const DEFAULT_ICON = null;

const firebaseConfig = {
  apiKey: "AIzaSyB_DCtWyUK2PSXOIqc0A9RCcBgll-aVTxI",
  authDomain: "rydixo-b47c0.firebaseapp.com",
  projectId: "rydixo-b47c0",
  storageBucket: "rydixo-b47c0.firebasestorage.app",
  messagingSenderId: "353048977456",
  appId: "1:353048977456:web:4f8b76c447ec62d8d34df5",
  measurementId: "G-ZBB7506KVG"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const n = payload.notification || {};
  const data = payload.data || {};
  const title = n.title || data.title || "Notification";
  const body = n.body || data.body || "";
  const icon = n.icon || n.image || data.icon || DEFAULT_ICON || undefined;
  const badge = n.badge || icon || undefined;
  const options = {
    body,
    tag: data.tag || "fcm-default",
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/dashboard", payload: data },
    ...(icon ? { icon } : {}),
    ...(badge ? { badge } : {}),
  };
  return self.registration.showNotification(title, options);
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
