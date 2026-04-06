import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home' },
  { to: '/start-workout', label: 'Start' },
  { to: '/progress', label: 'Progress' },
];

export function BottomNav(): JSX.Element {
  return (
    <nav
      aria-label='Primary'
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 24px), 560px)',
        background: 'rgba(19,23,28,0.94)',
        backdropFilter: 'blur(18px)',
        border: '1px solid var(--wb-border-strong)',
        borderRadius: 22,
        padding: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 8,
        zIndex: 20,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            minHeight: 48,
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            color: isActive ? '#111317' : 'var(--wb-text-muted)',
            background: isActive ? 'var(--wb-accent)' : 'transparent',
            fontWeight: 800,
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
