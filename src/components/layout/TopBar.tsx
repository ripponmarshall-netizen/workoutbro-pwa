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
        : 'WorkoutBro';

  return (
    <header className='wb-row-between' style={{ marginBottom: 20, paddingTop: 4 }}>
      <Link to='/' className='wb-row' style={{ gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: 'var(--wb-accent)',
            color: '#111317',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
          }}
        >
          WB
        </div>
        <div>
          <div className='wb-label'>WorkoutBro by Gordon</div>
          <div style={{ fontWeight: 800 }}>{title}</div>
        </div>
      </Link>
      <div
        aria-label='Profile'
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: 'var(--wb-surface-2)',
          border: '1px solid var(--wb-border)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--wb-text-muted)',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {initials('Workout Bro')}
      </div>
    </header>
  );
}
