import React, { useEffect, useRef, useState } from 'react';
import { useToastState, ToastTone } from '../../hooks/useToast';

const TONE_COLORS: Record<ToastTone, string> = {
  default: 'var(--wb-text)',
  success: 'var(--wb-success)',
  warning: 'var(--wb-warning)',
  danger: 'var(--wb-danger)',
  pr: 'var(--wb-pr)',
};

const TONE_BG: Record<ToastTone, string> = {
  default: 'rgba(31, 37, 45, 0.92)',
  success: 'rgba(71, 209, 109, 0.14)',
  warning: 'rgba(255, 182, 72, 0.14)',
  danger: 'rgba(255, 107, 95, 0.14)',
  pr: 'rgba(243, 156, 255, 0.14)',
};

export function ToastContainer(): JSX.Element | null {
  const toast = useToastState();
  const [displayed, setDisplayed] = useState(false);
  const lastToastRef = useRef(toast);

  if (toast) {
    lastToastRef.current = toast;
  }

  useEffect(() => {
    if (toast) {
      setDisplayed(true);
    } else {
      const t = setTimeout(() => setDisplayed(false), 300);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!displayed) return null;

  const tone = lastToastRef.current?.tone ?? 'default';
  const message = lastToastRef.current?.message ?? '';

  return (
    <div
      role='status'
      aria-live='polite'
      style={{
        position: 'fixed',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: toast
          ? 'wb-toast-in 0.22s ease-out forwards'
          : 'wb-toast-out 0.28s ease-in forwards',
        padding: '10px 20px',
        borderRadius: 999,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: TONE_BG[tone],
        border: `1px solid ${TONE_COLORS[tone]}33`,
        color: TONE_COLORS[tone],
        fontSize: 'var(--wb-font-sm)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: 'var(--wb-shadow-md)',
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      {message}
    </div>
  );
}
