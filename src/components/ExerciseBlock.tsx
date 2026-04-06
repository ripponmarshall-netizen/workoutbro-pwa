import React from 'react';
import type { PersonalRecord, SetEntry, WorkoutSessionExercise } from '../../types/domain';
import { SetRow } from './SetRow';
import { SecondaryButton } from '../common/SecondaryButton';
import { StatPill } from '../common/StatPill';

type Props = {
  block: WorkoutSessionExercise;
  exerciseName: string;
  primaryMuscle: string;
  previousPerformance: string;
  sets: SetEntry[];
  recentPrs: PersonalRecord[];
  onQuickAdd: () => Promise<void> | void;
  onCopyLast: () => Promise<void> | void;
  onUpdateSet: (setId: string, patch: Partial<SetEntry>) => Promise<void> | void;
  onToggleComplete: (setId: string) => Promise<void> | void;
};

export function ExerciseBlock({
  block,
  exerciseName,
  primaryMuscle,
  previousPerformance,
  sets,
  recentPrs,
  onQuickAdd,
  onCopyLast,
  onUpdateSet,
  onToggleComplete,
}: Props): JSX.Element {
  return (
    <section className='wb-card wb-stack-md'>
      <div className='wb-row-between' style={{ alignItems: 'flex-start' }}>
        <div className='wb-stack-sm'>
          <div className='wb-label'>{primaryMuscle}</div>
          <h3 className='wb-section-title' style={{ margin: 0 }}>{exerciseName}</h3>
          <div className='wb-muted'>Last performance: {previousPerformance}</div>
        </div>
        {recentPrs.length ? <StatPill label='PR' value={`${recentPrs.length} hit`} tone='pr' /> : null}
      </div>
      <div className='wb-row' style={{ flexWrap: 'wrap' }}>
        <SecondaryButton onClick={onQuickAdd}>Quick add set</SecondaryButton>
        <SecondaryButton onClick={onCopyLast}>Copy last set</SecondaryButton>
      </div>
      <div className='wb-list'>
        {sets.map((set) => (
          <SetRow
            key={set.localId}
            set={set}
            onSave={(patch) => onUpdateSet(set.localId, patch)}
            onCompleteToggle={() => onToggleComplete(set.localId)}
          />
        ))}
      </div>
      {block.blockNotes ? (
        <div className='wb-card wb-card-elevated'>
          <div className='wb-label'>Notes</div>
          <div className='wb-muted'>{block.blockNotes}</div>
        </div>
      ) : null}
    </section>
  );
}
