import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { seedDatabaseIfEmpty } from './seed/seedDatabase';
import { registerServiceWorker } from './pwa/registerServiceWorker';

async function bootstrap() {
  await seedDatabaseIfEmpty();
  registerServiceWorker();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}

bootstrap();