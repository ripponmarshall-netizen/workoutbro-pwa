import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: JSX.Element;
}

const HomeIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
    <path
      d='M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinejoin='round'
    />
    <path d='M7 18v-5h6v5' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
  </svg>
);

const StartIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
    <circle cx='10' cy='10' r='8' stroke='currentColor' strokeWidth='1.5' />
    <path d='M8.5 7l4.5 3-4.5 3V7z' fill='currentColor' />
  </svg>
);

const ProgressIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
    <polyline
      points='2,15 7,9 11,12 17,5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <polyline
      points='14,5 17,5 17,8'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SettingsIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
    <circle cx='10' cy='10' r='2.5' stroke='currentColor' strokeWidth='1.5' />
    <path
      d='M10 2.5v1M10 16.5v1M2.5 10h1M16.5 10h1M4.4 4.4l.7.7M14.9 14.9l.7.7M4.4 15.6l.7-.7M14.9 5.1l.7-.7'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);

const items: NavItem[] = [
  { to: '/', label: 'Home', end: true, icon: <HomeIcon /> },
  { to: '/start-workout', label: 'Start', icon: <StartIcon /> },
  { to: '/progress', label: 'Progress', icon: <ProgressIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
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
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 8,
        zIndex: 20,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            minHeight: 56,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            color: isActive ? '#111317' : 'var(--wb-text-muted)',
            background: isActive ? 'var(--wb-accent)' : 'transparent',
            fontWeight: 800,
            fontSize: 11,
          })}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
