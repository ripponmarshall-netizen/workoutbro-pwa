import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function SecondaryButton({ fullWidth = false, style, children, ...props }: Props): JSX.Element {
  return (
    <button
      {...props}
      style={{
        minHeight: '52px',
        width: fullWidth ? '100%' : undefined,
        borderRadius: '16px',
        border: '1px solid var(--wb-border-strong)',
        background: 'var(--wb-surface-2)',
        color: 'var(--wb-text)',
        fontWeight: 700,
        padding: '0 18px',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
