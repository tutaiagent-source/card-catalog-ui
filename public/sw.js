/* Minimal runtime-cache service worker for “Add to Home Screen” and basic offline support. */

const CACHE_NAME = "cardcat-pwa-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Try network first.
      try {
        const freshResponse = await fetch(request);
        // Cache only successful responses.
        if (freshResponse && freshResponse.ok) {
          cache.put(request, freshResponse.clone()).catch(() => {});
        }
        return freshResponse;
      } catch (err) {
        // Fall back to cache.
        const cached = await cache.match(request);
        if (cached) return cached;

        // If navigation fails, try cached root.
        if (request.mode === "navigate") {
          const cachedRoot = await cache.match("/");
          if (cachedRoot) return cachedRoot;
        }

        throw err;
      }
    })()
  );
});
