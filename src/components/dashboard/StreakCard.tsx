import React from 'react';

type Props = {
  streakDays: number;
  trainedThisWeek: number;
};

export function StreakCard({ streakDays, trainedThisWeek }: Props): JSX.Element {
  return (
    <div className='wb-card wb-card-elevated wb-stack-sm'>
      <div className='wb-label'>Current streak</div>
      <div className='wb-kpi-value'>{streakDays} days</div>
      <div className='wb-muted'>Trained {trainedThisWeek} times this week</div>
    </div>
  );
}
