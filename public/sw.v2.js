/* Service worker (v2) intentionally does *nothing* for fetch.
 *
 * Purpose: permanently stop the iOS/WebView “A problem repeatedly occurred”
 * loop by ensuring older SW versions can be replaced with a non-interfering
 * worker.
 */

self.addEventListener("install", (event) => {
  // Activate immediately.
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

      // Clear caches just in case an older worker stored something.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (_e) {
        // ignore
      }

      // Best-effort: unregister this worker so it can’t keep controlling.
      try {
        await self.registration.unregister();
      } catch (_e) {
        // ignore
      }
    })()
  );
});

// No `fetch` handler on purpose. Some iOS/WebView versions can behave
// unexpectedly when a fetch listener is present.
