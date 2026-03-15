const CACHE_NAME = "rydego-pwa-v1";

// Don't cache API, auth, or dynamic endpoints
function shouldSkipCache(url) {
  try {
    const u = new URL(url);
    return (
      u.pathname.startsWith("/api/") ||
      u.pathname.startsWith("/auth/") ||
      u.search.includes("_next/data")
    );
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || shouldSkipCache(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          const ok = response.type === "basic" && response.status === 200;
          if (ok && event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
        return cached || fetchPromise;
      })
    )
  );
});
