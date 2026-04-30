/**
 * AdCreator service worker — offline shell.
 *
 * Strategy:
 *   - PRECACHE the app shell (manifest, icons, offline fallback) at install
 *   - Static assets (/_next/static/...) → cache-first (immutable, hashed paths)
 *   - HTML navigations → network-first with offline fallback
 *   - Fonts (gstatic / self-hosted) → cache-first with 30-day TTL
 *   - Everything else → network-only (don't cache canvas API responses)
 *
 * No push notifications — those need VAPID keys we don't have. When
 * we wire them, add a 'push' listener here.
 *
 * Bump CACHE_VERSION on every shell change. Old caches are pruned on
 * 'activate'.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `adcreator-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `adcreator-static-${CACHE_VERSION}`;
const FONT_CACHE = `adcreator-fonts-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // Activate immediately on first install — don't make the user reload.
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll is all-or-nothing — if any asset 404s, the whole install
      // fails. Use Promise.allSettled-style add() per item instead so
      // a missing /offline page doesn't kill the SW.
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[sw] precache miss for ${url}:`, err);
          }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  // Take control of all open clients without requiring a reload.
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Prune old caches from prior versions.
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (k) =>
                  k.startsWith("adcreator-") &&
                  ![SHELL_CACHE, STATIC_CACHE, FONT_CACHE].includes(k),
              )
              .map((k) => caches.delete(k)),
          ),
        ),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // SW only handles GET — POSTs / mutations always hit network.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests except gstatic fonts.
  if (url.origin !== self.location.origin && url.host !== "fonts.gstatic.com") {
    return;
  }

  // Skip Next.js HMR and dev-only routes.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  // Skip API + auth — never cache user-state-bearing responses.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/auth/")) return;

  // Static hashed assets — cache-first (immutable).
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Fonts — cache-first.
  if (
    url.host === "fonts.gstatic.com" ||
    url.pathname.startsWith("/api/fontfile/")
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // HTML navigations — network-first with offline fallback.
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: try network, fall back to cache (for shell assets).
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((r) => r || Response.error()),
    ),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (_err) {
    // No network and no cache — return a 504 so the page can show its
    // own offline state rather than the browser's chrome error.
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    // Cache successful HTML so the offline shell can serve last-known-good.
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match("/offline");
    if (offline) return offline;
    return new Response("Offline. Reconnect to continue.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
