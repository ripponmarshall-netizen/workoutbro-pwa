import React from 'react';

type Props = {
  label: string;
  value: string;
  subtext?: string;
  tone?: 'default' | 'accent' | 'xp';
};

export function MetricCard({ label, value, subtext, tone = 'default' }: Props): JSX.Element {
  const color = tone === 'accent' ? 'var(--wb-accent)' : tone === 'xp' ? 'var(--wb-xp)' : 'var(--wb-text)';
  return (
    <div className='wb-card wb-card-elevated wb-stack-sm'>
      <div className='wb-label'>{label}</div>
      <div className='wb-kpi-value' style={{ color }}>{value}</div>
      {subtext ? <div className='wb-muted'>{subtext}</div> : null}
    </div>
  );
}
