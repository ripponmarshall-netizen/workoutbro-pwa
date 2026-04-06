import React from 'react';
import type { PersonalRecord } from '../../types/domain';
import { formatDate, formatNumber } from '../../lib/format';
import { EmptyState } from '../common/EmptyState';

type Props = {
  prs: PersonalRecord[];
  exerciseNameById: Record<string, string>;
};

export function RecentPrsCard({ prs, exerciseNameById }: Props): JSX.Element {
  if (!prs.length) {
    return <EmptyState title='No PRs yet' body='Your first serious sessions will start stacking records here.' />;
  }

  return (
    <div className='wb-card wb-stack-md'>
      <div className='wb-row-between'>
        <h3 className='wb-section-title'>Recent PRs</h3>
        <div className='wb-pill' style={{ color: 'var(--wb-pr)' }}>{prs.length} recent</div>
      </div>
      <div className='wb-list'>
        {prs.map((pr) => (
          <div key={pr.localId} className='wb-row-between'>
            <div>
              <div style={{ fontWeight: 700 }}>{exerciseNameById[pr.exerciseLocalId] ?? 'Exercise'}</div>
              <div className='wb-muted'>{pr.prType.replace(/_/g, ' ')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--wb-pr)', fontWeight: 800 }}>{formatNumber(pr.valueNumeric)} {pr.valueUnit}</div>
              <div className='wb-faint'>{formatDate(pr.achievedAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
