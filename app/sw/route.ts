// Serve the service worker JS from a Next.js route so we can control
// caching headers reliably (Vercel/Next may otherwise cache `/public/sw.js`).

const swJs = `/* Minimal runtime-cache service worker for CardCat.
 *
 * Critical: This worker MUST NOT call event.respondWith for fetch events.
 * iOS/WebView can get stuck in navigation loops if it serves stale HTML
 * or intercepts fetches.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try { await self.clients.claim(); } catch (_e) {}

      // Best-effort: clear caches and unregister to avoid stale control.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (_e) {}

      try { await self.registration.unregister(); } catch (_e) {}
    })()
  );
});

self.addEventListener("fetch", (_event) => {
  // Intentionally no interception.
});
`;

export function GET() {
  return new Response(swJs, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

