import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hapticHeavy } from '../../lib/haptics';

type Props = {
  startedAt: string | null;
  targetSeconds: number | null;
};

export function RestTimer({ startedAt, targetSeconds }: Props): JSX.Element | null {
  const [now, setNow] = useState(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    if (!startedAt || !targetSeconds) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, targetSeconds]);

  // Reset the haptic guard whenever a new timer session begins
  useEffect(() => {
    firedRef.current = false;
  }, [startedAt, targetSeconds]);

  const view = useMemo(() => {
    if (!startedAt || !targetSeconds) return null;
    const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
    const delta = targetSeconds - elapsed;
    const abs = Math.abs(delta);
    const mm = String(Math.floor(abs / 60)).padStart(2, '0');
    const ss = String(abs % 60).padStart(2, '0');
    return {
      label: delta >= 0 ? 'Rest' : 'Overtime',
      value: `${mm}:${ss}`,
      tone: delta >= 0 ? 'var(--wb-accent)' : 'var(--wb-warning)',
      delta,
    };
  }, [now, startedAt, targetSeconds]);

  // Fire haptic once when the rest timer reaches zero
  useEffect(() => {
    if (!view) return;
    if (view.delta <= 0 && !firedRef.current) {
      firedRef.current = true;
      hapticHeavy();
    }
  }, [view]);

  if (!view) return null;

  return (
    <div className='wb-card wb-row-between' style={{ padding: '14px 16px' }}>
      <div>
        <div className='wb-label'>{view.label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: view.tone }}>{view.value}</div>
      </div>
      <div className='wb-pill'>Stay sharp</div>
    </div>
  );
}
