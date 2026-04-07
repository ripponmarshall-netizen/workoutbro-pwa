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

/**
 * Fix for "Cannot find name 'SyncEvent'" in GitHub Actions.
 * Explicitly defining the interface ensures the compiler recognizes the type.
 */
interface SyncEvent extends ExtendableEvent {
  readonly lastChance: boolean;
  readonly tag: string;
}

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
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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

// ─── Message handler: SKIP_WAITING ───────────────────────────────────────────

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Background Sync: outbox flush ──────────────────────────────────────────

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'workoutbro-outbox-flush') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_SYNC_TRIGGER' }));
      }),
    );
  }
});

export {};
