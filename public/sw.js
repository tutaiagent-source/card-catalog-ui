/* Disabled-by-default service worker.
 *
 * Mobile iOS/WebView can get stuck in navigation loops if this worker
 * intercepts fetches and/or serves cached HTML.
 *
 * This worker intentionally does NOT call `event.respondWith(...)` for
 * fetch events, letting the browser perform normal network handling.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch (_e) {
        // ignore
      }

      // Clear any old caches to prevent stale HTML.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (_e) {
        // ignore
      }

      // Best-effort: unregister so this worker stops controlling.
      try {
        await self.registration.unregister();
      } catch (_e) {
        // ignore
      }
    })()
  );
});

self.addEventListener("fetch", (_event) => {
  // Intentionally no interception.
});
