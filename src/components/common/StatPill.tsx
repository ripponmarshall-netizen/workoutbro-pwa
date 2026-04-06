import React from 'react';

type Props = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'success' | 'pr';
};

export function StatPill({ label, value, tone = 'default' }: Props): JSX.Element {
  const toneStyles: Record<Props['tone'], React.CSSProperties> = {
    default: {},
    accent: { borderColor: 'rgba(212,255,63,0.3)', color: 'var(--wb-text)' },
    success: { borderColor: 'rgba(71,209,109,0.35)', color: 'var(--wb-success)' },
    pr: { borderColor: 'rgba(243,156,255,0.35)', color: 'var(--wb-pr)' },
  };

  return (
    <div className='wb-pill' style={toneStyles[tone]}>
      <span className='wb-faint'>{label}</span>
      <strong style={{ color: 'inherit' }}>{value}</strong>
    </div>
  );
}
