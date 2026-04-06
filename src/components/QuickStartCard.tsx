import React from 'react';
import { Link } from 'react-router-dom';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';

type Props = {
  activeSessionId?: string | null;
};

export function QuickStartCard({ activeSessionId }: Props): JSX.Element {
  return (
    <div className='wb-card wb-stack-md' style={{ padding: 20 }}>
      <div className='wb-label'>Momentum</div>
      <div className='wb-stack-sm'>
        <h2 className='wb-screen-title' style={{ fontSize: 'clamp(30px, 8vw, 42px)' }}>
          Train with intent.
        </h2>
        <p className='wb-screen-subtitle'>Open strong, log fast, finish clean.</p>
      </div>
      <div className='wb-grid wb-grid-2'>
        {activeSessionId ? (
          <Link to={`/workout/active/${activeSessionId}`}>
            <PrimaryButton fullWidth>Resume Workout</PrimaryButton>
          </Link>
        ) : (
          <Link to='/start-workout'>
            <PrimaryButton fullWidth>Start Workout</PrimaryButton>
          </Link>
        )}
        <Link to='/progress'>
          <SecondaryButton fullWidth>Review Progress</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
