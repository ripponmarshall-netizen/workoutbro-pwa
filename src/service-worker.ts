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

// ─── Lifecycle ───────────────────────────────────────────────────────────────

// Take control of already-open clients once this SW becomes active.
clientsClaim();

// Remove old precaches created by previous Workbox versions/builds.
cleanupOutdatedCaches();

// ─── Precache ────────────────────────────────────────────────────────────────

// Injected at build time by vite-plugin-pwa / Workbox injectManifest.
// Do not remove.
precacheAndRoute(self.__WB_MANIFEST);

// ─── Navigation: app-shell fallback to precached index.html ─────────────────
// Covers React Router client-side navigation.
// Excludes backend routes so API/sync requests are never treated as SPA pages.

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//, /^\/sync\//],
  }),
);

// ─── Exercise library meta stale-while-revalidate ──────────────────────
// Fast cached reads with background refresh.

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (
      url.pathname.startsWith('/api/exercises') ||
      url.pathname.startsWith('/api/library') ||
      url.pathname.startsWith('/api/muscle-groups')
    ),
  new StaleWhileRevalidate({
    cacheName: 'wb-exercise-api-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── Exercise diagrams and muscle visuals: cache-first ──────────────────────
// Semi-static assets that should be instant once cached.

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (
      url.pathname.startsWith('/exercise-media/') ||
      url.pathname.startsWith('/assets/diagrams/') ||
      url.pathname.startsWith('/assets/muscles/')
    ),
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

// ─── Static assets (fonts, icons, misc asset files): cache-first ────────────

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    url.pathname.startsWith('/assets/') &&
    !url.pathname.startsWith('/assets/diagrams/') &&
    !url.pathname.startsWith('/assets/muscles/'),
  new CacheFirst({
    cacheName: 'wb-static-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── User/account API: network-first ────────────────────────────────────────
// Prefer fresh data, fall back to last successful cached response if offline.

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (
      url.pathname.startsWith('/api/user') ||
      url.pathname.startsWith('/api/me')
    ),
  new NetworkFirst({
    cacheName: 'wb-user-api-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── Mutation requests: do not cache ────────────────────────────────────────
// POST/PUT/PATCH/DELETE are not intercepted by these Workbox routes and should
// be handled by your app's outbox / sync engine instead.

// ─── Message handler: SKIP_WAITING ───────────────────────────────────────────
// The UI can send this after the user accepts an update prompt.

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Background Sync: outbox flush trigger ───────────────────────────────────
// Uses a structural type instead of SyncEvent so builds do not depend on the
// global Background Sync typings being available in TypeScript.
//
// This is progressive enhancement only:
// - if Background Sync fires, notify open clients to flush;
// - correctness should still come from app-open / reconnect flush logic.

self.addEventListener('sync', (event: ExtendableEvent & { tag?: string }) => {
  if (event.tag === 'workoutbro-outbox-flush') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_SYNC_TRIGGER' });
          });
        }),
    );
  }
});

export {};
