import React from 'react';
import { formatTime, formatDuration } from '../../lib/format';
import { PrimaryButton } from '../common/PrimaryButton';

type Props = {
  title: string;
  startedAt: string;
  durationMs: number;
  onFinish: () => void;
};

export function WorkoutHeader({ title, startedAt, durationMs, onFinish }: Props): JSX.Element {
  return (
    <div className='wb-card wb-stack-md'>
      <div className='wb-row-between'>
        <div>
          <div className='wb-label'>Active workout</div>
          <h1 className='wb-screen-title' style={{ fontSize: 'clamp(26px,7vw,34px)' }}>{title}</h1>
          <p className='wb-screen-subtitle'>Started {formatTime(startedAt)}</p>
        </div>
        <PrimaryButton onClick={onFinish}>Finish</PrimaryButton>
      </div>
      <div className='wb-grid wb-grid-2'>
        <div className='wb-card wb-card-elevated'>
          <div className='wb-label'>Duration</div>
          <div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatDuration(durationMs)}</div>
        </div>
        <div className='wb-card wb-card-elevated'>
          <div className='wb-label'>Mode</div>
          <div className='wb-kpi-value' style={{ fontSize: 24 }}>Locked in</div>
        </div>
      </div>
    </div>
  );
}
