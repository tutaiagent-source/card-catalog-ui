/* Minimal runtime-cache service worker.
 *
 * Goal: keep iOS/WebView stable by NOT caching Next.js HTML/JS chunks.
 * We only cache static images/brand assets (best-effort), and we always
 * go network-first for navigations.
 */

const CACHE_NAME = "cardcat-pwa-v2";

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
            .map((k) => caches.delete(k))
        )
      ),
      // Fully disable this service worker so iOS/WebView stops using it.
      // This helps if an older SW version got stuck and causes navigation loops.
      (async () => {
        try {
          await self.registration.unregister();
        } catch (_e) {
          // ignore
        }
      })(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  // Debug / stability mode: don’t intercept any requests.
  // Let the browser do normal network fetches to avoid iOS WebView loops.
  return;
});
