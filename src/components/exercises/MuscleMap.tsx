import React from 'react';

type Props = {
  primaryMuscle: string;
  secondaryMuscles?: string[];
};

export function MuscleMap({ primaryMuscle, secondaryMuscles = [] }: Props): JSX.Element {
  return (
    <div className='wb-card wb-card-elevated wb-stack-md'>
      <div className='wb-label'>Muscle target</div>
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 220, borderRadius: 18, border: '1px solid var(--wb-border)', background: 'linear-gradient(180deg, rgba(83,210,255,0.04), rgba(255,255,255,0))' }}>
        <div style={{ width: 120, height: 180, borderRadius: 60, border: '1px solid var(--wb-border-strong)', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ position: 'absolute', top: 58, left: 26, right: 26, height: 52, borderRadius: 18, background: 'rgba(212,255,63,0.18)', border: '1px solid rgba(212,255,63,0.24)' }} />
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 46, height: 46, borderRadius: 999, border: '1px solid var(--wb-border)' }} />
        </div>
      </div>
      <div className='wb-row' style={{ flexWrap: 'wrap' }}>
        <div className='wb-pill' style={{ color: 'var(--wb-accent)' }}>Primary: {primaryMuscle}</div>
        {secondaryMuscles.map((muscle) => (
          <div key={muscle} className='wb-pill'>{muscle}</div>
        ))}
      </div>
    </div>
  );
}
