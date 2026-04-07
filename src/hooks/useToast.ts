import { useEffect, useState } from 'react';

export type ToastTone = 'default' | 'success' | 'warning' | 'danger' | 'pr';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

type Listener = (toast: Toast | null) => void;

let current: Toast | null = null;
let nextId = 0;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l(current));
}

export function showToast(message: string, tone: ToastTone = 'default'): void {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  current = { id: nextId++, message, tone };
  notify();
  dismissTimer = setTimeout(() => {
    current = null;
    notify();
    dismissTimer = null;
  }, 2800);
}

export function useToastState(): Toast | null {
  const [toast, setToast] = useState<Toast | null>(current);

  useEffect(() => {
    listeners.add(setToast);
    return () => {
      listeners.delete(setToast);
    };
  }, []);

  return toast;
}
