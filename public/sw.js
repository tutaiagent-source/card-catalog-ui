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

  // Always go to the network for navigations and JS/CSS assets.
  // This avoids stale chunk / redirect / reload loops in in-app browsers.
  if (isHtmlDocument || isNextAsset || isApi) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache only static images and branding assets.
  const shouldCache =
    pathname.startsWith("/brand/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname);

  if (!shouldCache) {
    event.respondWith(fetch(request));
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
