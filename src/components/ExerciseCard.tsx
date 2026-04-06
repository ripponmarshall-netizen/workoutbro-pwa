import React from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../../types/domain';
import { SecondaryButton } from '../common/SecondaryButton';

type Props = {
  exercise: Exercise;
  equipmentLabel?: string;
  muscleLabel?: string;
  onQuickAdd?: () => Promise<void> | void;
};

export function ExerciseCard({ exercise, equipmentLabel, muscleLabel, onQuickAdd }: Props): JSX.Element {
  return (
    <div className='wb-card wb-row-between' style={{ alignItems: 'stretch' }}>
      <div className='wb-stack-sm' style={{ flex: 1 }}>
        <div className='wb-label'>{muscleLabel ?? 'Exercise'}</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{exercise.name}</div>
        <div className='wb-muted'>{equipmentLabel ?? 'Equipment not set'}</div>
      </div>
      <div className='wb-stack-sm' style={{ width: 140 }}>
        {onQuickAdd ? <SecondaryButton onClick={onQuickAdd}>Add</SecondaryButton> : null}
        <Link to={`/exercise/${exercise.localId}`}>
          <SecondaryButton fullWidth>Detail</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
