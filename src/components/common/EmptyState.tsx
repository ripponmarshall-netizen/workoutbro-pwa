import React from 'react';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ title, body, ctaLabel, onCta }: Props): JSX.Element {
  return (
    <div className='wb-card wb-card-elevated wb-stack-md' style={{ textAlign: 'center', padding: '28px 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto', background: 'var(--wb-surface-3)', border: '1px solid var(--wb-border)' }} />
      <div>
        <h3 className='wb-section-title' style={{ marginBottom: 8 }}>{title}</h3>
        <p className='wb-muted' style={{ margin: 0 }}>{body}</p>
      </div>
      {ctaLabel && onCta ? <PrimaryButton onClick={onCta}>{ctaLabel}</PrimaryButton> : null}
    </div>
  );
}
