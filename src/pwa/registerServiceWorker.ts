import { registerSW } from 'virtual:pwa-register';

let swUpdateReady: (() => void) | null = null;

/**
 * Call this when the user confirms they want to apply the waiting SW update.
 * Should only be offered when no active workout is in progress.
 */
export function applyServiceWorkerUpdate() {
  if (swUpdateReady) {
    swUpdateReady();
    swUpdateReady = null;
  }
}

/**
 * Returns true if a new SW version is waiting to activate.
 * Use this to gate the update banner in the UI.
 */
export function isUpdateReady() {
  return swUpdateReady !== null;
}

export function registerServiceWorker(
  onUpdateReady?: () => void,
  onSyncTrigger?: () => void,
) {
  if (!('serviceWorker' in navigator)) return;

  // registerSW from vite-plugin-pwa handles registration, waiting detection,
  // and calls onNeedRefresh when a new SW is waiting.
  const updateSW = registerSW({
    onNeedRefresh() {
      // A new SW is installed and waiting — do NOT auto-reload.
      // Store the update callback and notify the UI layer.
      swUpdateReady = () => updateSW(true);
      onUpdateReady?.();
    },
    onOfflineReady() {
      // App is cached and ready for offline use.
      console.info('[WorkoutBro] App is ready for offline use.');
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Periodically check for SW updates in the background (every 60 min).
      setInterval(() => {
        if (!navigator.onLine) return;
        registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });

  // Listen for SW_SYNC_TRIGGER from Background Sync event in service-worker.ts.
  // When the SW wakes up due to a background sync event, it pings all clients.
  // We respond by running the outbox flush.
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'SW_SYNC_TRIGGER') {
      onSyncTrigger?.();
    }
  });
}
