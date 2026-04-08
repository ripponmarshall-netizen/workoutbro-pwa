import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ fullWidth = false, style, className, children, ...props }: Props): JSX.Element {
  return (
    <button
      {...props}
      className={`wb-btn-primary${className ? ' ' + className : ''}`}
      style={{
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
