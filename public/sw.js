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

  const pathname = url.pathname || "";
  const isNavigate = request.mode === "navigate";
  const isNextAsset = pathname.startsWith("/_next/") || pathname.includes(".map");
  const isHtmlDocument = isNavigate || request.destination === "document";
  const isApi = pathname.startsWith("/api/");

  // IMPORTANT:
  // Don’t intercept navigations or JS/API requests at all.
  // Some iOS/WebView builds treat SW-handled navigation responses poorly and
  // can end up in reload/error loops. Let the browser handle those.
  if (isHtmlDocument || isNextAsset || isApi) return;

  // Cache only static images and branding assets.
  const shouldCache =
    pathname.startsWith("/brand/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname);

  if (!shouldCache) {
    // Don’t intercept anything else.
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const freshResponse = await fetch(request);
        if (freshResponse && freshResponse.ok) {
          cache.put(request, freshResponse.clone()).catch(() => {});
        }
        return freshResponse;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
