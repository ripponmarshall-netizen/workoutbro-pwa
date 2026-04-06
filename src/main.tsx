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
    // onUpdateReady — called when a new SW is waiting.
    // TODO: dispatch to a global UI store/state so the app can show
    // an update banner that respects active workout state.
    () => {
      console.info('[WorkoutBro] App update ready. Will prompt after workout.');
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
