import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { initials } from '../../lib/format';

export function TopBar(): JSX.Element {
  const location = useLocation();
  const title = location.pathname.startsWith('/progress')
    ? 'Progress'
    : location.pathname.startsWith('/start-workout')
      ? 'Start Workout'
      : location.pathname.startsWith('/workout/active')
        ? 'Workout Mode'
        : location.pathname.startsWith('/settings')
          ? 'Settings'
          : 'WorkoutBro';

  return (
    <header className='wb-topbar'>
      <Link to='/' className='wb-row' style={{ gap: 12 }}>
        <div className='wb-topbar-logo'>WB</div>
        <div>
          <div className='wb-label'>WorkoutBro by Gordon</div>
          <div style={{ fontWeight: 800 }}>{title}</div>
        </div>
      </Link>
      <div aria-label='Profile' className='wb-topbar-avatar'>
        {initials('Workout Bro')}
      </div>
    </header>
  );
}
