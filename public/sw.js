const CACHE_NAME = "pwa-cache-v2";

// Don't cache API, auth, or dynamic endpoints
function shouldSkipCache(url) {
  try {
    const u = new URL(url);
    return (
      u.pathname.startsWith("/api/") ||
      u.pathname.startsWith("/auth/") ||
      u.search.includes("_next/data") ||
      // App Router / RSC requests should never be cached by SW
      u.searchParams.has("_rsc") ||
      u.search.includes("__flight__")
    );
  } catch {
    return false;
  }
}

function isStaticAssetRequest(request) {
  const dest = request.destination;
  return (
    dest === "style" ||
    dest === "script" ||
    dest === "image" ||
    dest === "font" ||
    dest === "manifest"
  );
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
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const accept = (event.request.headers.get("accept") || "").toLowerCase();

  // Never cache cross-origin.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache API/auth/Next flight/RSC traffic.
  if (shouldSkipCache(event.request.url)) {
    return;
  }

  // Don't cache navigations or HTML-like responses; always go to network
  // so server actions + revalidatePath are reflected immediately.
  if (event.request.mode === "navigate" || accept.includes("text/html")) {
    return;
  }

  // Only cache static assets. For everything else (e.g. JSON from route handlers
  // not under /api), just fall back to normal network behavior.
  if (!isStaticAssetRequest(event.request)) {
    return;
  }

  // Cache-first for static assets with background refresh.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          const ok = response.type === "basic" && response.status === 200;
          if (ok) cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    )
  );
});
