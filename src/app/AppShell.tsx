import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { TopBar } from '../components/layout/TopBar';
import { ToastContainer } from '../components/common/Toast';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { UpdateBanner } from '../components/common/UpdateBanner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { applyServiceWorkerUpdate } from '../pwa/registerServiceWorker';
import '../styles/global.css';

const hiddenBottomNavRoutes = ['/workout/active'];

export function AppShell(): JSX.Element {
  const location = useLocation();
  const hideBottomNav = hiddenBottomNavRoutes.some((path) =>
    location.pathname.startsWith(path),
  );

  const [updateReady, setUpdateReady] = useState(false);

  // Listen for the custom event dispatched by main.tsx when a new SW is waiting.
  useEffect(() => {
    const handler = () => setUpdateReady(true);
    window.addEventListener('sw-update-ready', handler);
    return () => window.removeEventListener('sw-update-ready', handler);
  }, []);

  const handleUpdate = () => {
    // applyServiceWorkerUpdate calls updateSW(true) from vite-plugin-pwa,
    // which posts SKIP_WAITING to the waiting SW and then reloads the page.
    applyServiceWorkerUpdate();
  };

  return (
    <div className='wb-app-shell'>
      {/* Fixed PWA banners — rendered outside normal flow */}
      <OfflineBanner />
      <UpdateBanner show={updateReady} onUpdate={handleUpdate} />

      <TopBar />

      <ErrorBoundary>
        <div key={location.pathname} className='wb-page-enter'>
          <Outlet />
        </div>
      </ErrorBoundary>

      {!hideBottomNav && <BottomNav />}
      <ToastContainer />
    </div>
  );
}
