import React, { useState } from 'react';
import type { SetEntry, SetType } from '../../types/domain';
import { SecondaryButton } from '../common/SecondaryButton';

type Draft = {
  weightValue: number | null;
  reps: number | null;
  setType: SetType;
};

type Props = {
  set: SetEntry;
  onSave: (patch: Partial<SetEntry>) => Promise<void> | void;
  onCompleteToggle: () => Promise<void> | void;
};

export function SetRow({ set, onSave, onCompleteToggle }: Props): JSX.Element {
  const [draft, setDraft] = useState<Draft>({
    weightValue: set.weightValue,
    reps: set.reps,
    setType: set.setType,
  });
  const [editing, setEditing] = useState(false);

  const persist = async () => {
    await onSave({
      weightValue: draft.weightValue,
      reps: draft.reps,
      setType: draft.setType,
    });
    setEditing(false);
  };

  return (
    <div className='wb-card wb-card-elevated wb-stack-sm' style={{ padding: 12 }}>
      <div className='wb-row-between'>
        <div className='wb-row'>
          <div className='wb-pill'>Set {set.setNumber}</div>
          <div className='wb-pill'>{set.setType}</div>
        </div>
        <button
          onClick={onCompleteToggle}
          style={{
            minWidth: 86,
            minHeight: 42,
            borderRadius: 14,
            border: `1px solid ${set.isCompleted ? 'rgba(71,209,109,0.45)' : 'var(--wb-border)'}`,
            background: set.isCompleted ? 'rgba(71,209,109,0.12)' : 'var(--wb-surface-3)',
            color: set.isCompleted ? 'var(--wb-success)' : 'var(--wb-text-muted)',
            fontWeight: 800,
          }}
        >
          {set.isCompleted ? 'Done' : 'Mark'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.9fr', gap: 10 }}>
        <input
          inputMode='decimal'
          value={draft.weightValue ?? ''}
          onChange={(e) => setDraft((s) => ({ ...s, weightValue: e.target.value ? Number(e.target.value) : null }))}
          placeholder='kg'
          disabled={!editing}
        />
        <input
          inputMode='numeric'
          value={draft.reps ?? ''}
          onChange={(e) => setDraft((s) => ({ ...s, reps: e.target.value ? Number(e.target.value) : null }))}
          placeholder='reps'
          disabled={!editing}
        />
        <select value={draft.setType} disabled={!editing} onChange={(e) => setDraft((s) => ({ ...s, setType: e.target.value as SetType }))}>
          <option value='warmup'>Warmup</option>
          <option value='working'>Working</option>
          <option value='drop'>Drop</option>
          <option value='amrap'>AMRAP</option>
          <option value='backoff'>Backoff</option>
          <option value='failure'>Failure</option>
        </select>
      </div>
      <div className='wb-row-between'>
        {editing ? (
          <SecondaryButton onClick={() => setEditing(false)} style={{ minHeight: 42 }}>Cancel</SecondaryButton>
        ) : (
          <button className='wb-link-button' onClick={() => setEditing(true)}>Edit</button>
        )}
        {editing ? <SecondaryButton onClick={persist} style={{ minHeight: 42 }}>Save set</SecondaryButton> : null}
      </div>
    </div>
  );
}
