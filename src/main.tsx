import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { seedDatabaseIfEmpty } from './seed/seedDatabase';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { SyncEngine } from './services/syncEngine';

const syncEngine = new SyncEngine();

async function bootstrap() {
  await seedDatabaseIfEmpty();

  registerServiceWorker(
    // onUpdateReady — a new SW version is installed and waiting.
    // Dispatch a DOM event so AppShell can surface the update banner at the
    // right moment (it has the workout-active context to decide when to show).
    () => {
      window.dispatchEvent(new Event('sw-update-ready'));
    },
    // onSyncTrigger — called when Background Sync wakes the app.
    () => {
      syncEngine.flushPending().catch(() => undefined);
    },
  );

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}

bootstrap();
