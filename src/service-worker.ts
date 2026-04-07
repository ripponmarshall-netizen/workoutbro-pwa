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

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<any>;
};

// ─── Lifecycle ───────────────────────────────────────────────────────────────

clientsClaim();
cleanupOutdatedCaches();

// ─── Precache ────────────────────────────────────────────────────────────────

precacheAndRoute(self.__WB_MANIFEST);

// ─── Navigation: network-first, fall back to precached shell ─────────────────

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//, /^\/sync\//],
  }),
);

// ─── Exercise library meta stale-while-revalidate ───────────────────────

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
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
);

// ─── Exercise diagrams and muscle visuals: cache-first ───────────────────────

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
        maxAgeSeconds: 60 * 60 * 24 * 30,
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
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  }),
);

// ─── Message handler: SKIP_WAITING ───────────────────────────────────────────

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Background Sync: outbox flush (progressive enhancement) ─────────────────
// The Background Sync API's SyncEvent type is NOT part of TypeScript's
// standard WebWorker lib, so we avoid referencing it as a type annotation.
// The sync event handler receives an Event at compile time; at runtime the
// browser provides the full SyncEvent object with .tag and .waitUntil().

self.addEventListener('sync', (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syncEvent = event as any;
  if (syncEvent.tag === 'workoutbro-outbox-flush') {
    syncEvent.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SW_SYNC_TRIGGER' }),
        );
      }),
    );
  }
});

export {};
