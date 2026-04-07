import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { TopBar } from '../components/layout/TopBar';
import { ToastContainer } from '../components/common/Toast';
import '../styles/global.css';

const hiddenBottomNavRoutes = ['/workout/active'];

export function AppShell(): JSX.Element {
  const location = useLocation();
  const hideBottomNav = hiddenBottomNavRoutes.some((path) => location.pathname.startsWith(path));

  return (
    <div className='wb-app-shell'>
      <TopBar />
      <div key={location.pathname} className='wb-page-enter'>
        <Outlet />
      </div>
      {!hideBottomNav && <BottomNav />}
      <ToastContainer />
    </div>
  );
}
