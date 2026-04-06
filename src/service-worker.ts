/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />
import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  createHandlerBoundToURL,
  cleanupOutdatedCaches,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Background Sync API types are not included in TypeScript's standard
// WebWorker lib. Declare the interface locally so tsc can compile.
interface SyncEvent extends ExtendableEvent {
  readonly lastChance: boolean;
  readonly tag: string;
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

// Take control immediately on activation rather than waiting for a page reload
clientsClaim();

// Clean up precache entries from old SW versions on activate
cleanupOutdatedCaches();

// ─── Precache ────────────────────────────────────────────────────────────────

// __WB_MANIFEST is replaced at build time by vite-plugin-pwa with the
// full list of versioned app shell assets (JS, CSS, HTML, fonts, icons).
// Do NOT remove or modify this line.
precacheAndRoute(self.__WB_MANIFEST);

// ─── Navigation: network-first, fall back to precached shell ─────────────────
// This covers React Router client-side navigation.
// If offline, the precached index.html is served so the SPA can still boot.

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // Exclude API routes from SPA navigation handling
    denylist: [/^\/api\//, /^\/sync\//],
  }),
);

// ─── Exercise library meta stale-while-revalidate ───────────────────────
// Fast reads from cache, background refresh when online.
// Applies to any /api/exercises or /api/library requests.

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/exercises') ||
    url.pathname.startsWith('/api/library') ||
    url.pathname.startsWith('/api/muscle-groups'),
  new StaleWhileRevalidate({
    cacheName: 'wb-exercise-api-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  }),
);

// ─── Exercise diagrams and muscle visuals: cache-first ───────────────────────
// These are semi-static. Serve from cache on first hit, refresh on expiry.

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/exercise-media/') ||
    url.pathname.startsWith('/assets/diagrams/') ||
    url.pathname.startsWith('/assets/muscles/'),
  new CacheFirst({
    cacheName: 'wb-exercise-media-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── Static assets (fonts, icons): cache-first ───────────────────────────────

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/assets/') &&
    !url.pathname.startsWith('/assets/diagrams/') &&
    !url.pathname.startsWith('/assets/muscles/'),
  new CacheFirst({
    cacheName: 'wb-static-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

// ─── User profile / account API: network-first ───────────────────────────────
// Prefer fresh data, fall back to last cached snapshot if offline.

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/user') ||
    url.pathname.startsWith('/api/me'),
  new NetworkFirst({
    cacheName: 'wb-user-api-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  }),
);

// ─── Mutation requests: NEVER cache ──────────────────────────────────────────
// POST/PUT/PATCH/DELETE must go through the sync queue in IndexedDB.
// Service worker must not intercept or cache them — they have their own
// idempotency and retry semantics in syncEngine.ts.
// (Workbox only intercepts GET by default — this comment is for clarity.)

// ─── Message handler: SKIP_WAITING ───────────────────────────────────────────
// The UI sends this message when the user confirms an update after a workout.

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Background Sync: outbox flush (progressive enhancement only) ─────────────
// This fires IF the browser supports Background Sync AND the SW was kept alive.
// correctness does NOT depend on this. syncEngine.ts handles the primary flush
// on app-open and on reconnect.

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'workoutbro-outbox-flush') {
    // The actual flush is triggered in the app via postMessage or
    // by syncing on next open. This event just re-activates the client.
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_SYNC_TRIGGER' }));
      }),
    );
  }
});

export {};
