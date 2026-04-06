import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ fullWidth = false, style, children, ...props }: Props): JSX.Element {
  return (
    <button
      {...props}
      style={{
        minHeight: '52px',
        width: fullWidth ? '100%' : undefined,
        borderRadius: '16px',
        border: '1px solid rgba(212,255,63,0.38)',
        background: 'var(--wb-accent)',
        color: '#111317',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        padding: '0 18px',
        boxShadow: '0 10px 24px rgba(212,255,63,0.18)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
