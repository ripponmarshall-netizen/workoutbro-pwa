import React from 'react';

type Props = {
  rankLabel: string;
  level: number;
  totalXp: number;
  nextLevelXp: number;
};

export function RankCard({ rankLabel, level, totalXp, nextLevelXp }: Props): JSX.Element {
  const progress = Math.min(100, Math.round((totalXp / nextLevelXp) * 100));

  return (
    <div className='wb-card wb-stack-md'>
      <div className='wb-row-between'>
        <div>
          <div className='wb-label'>Rank</div>
          <div className='wb-kpi-value' style={{ fontSize: 28 }}>{rankLabel}</div>
        </div>
        <div className='wb-pill' style={{ color: 'var(--wb-xp)' }}>Level {level}</div>
      </div>
      <div>
        <div className='wb-row-between' style={{ marginBottom: 8 }}>
          <span className='wb-muted'>{totalXp} XP</span>
          <span className='wb-faint'>{nextLevelXp} XP next</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: 'var(--wb-surface-3)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--wb-accent), var(--wb-xp))' }} />
        </div>
      </div>
    </div>
  );
}
