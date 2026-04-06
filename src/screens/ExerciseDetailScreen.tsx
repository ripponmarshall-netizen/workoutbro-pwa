import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';
import { MuscleMap } from '../components/exercises/MuscleMap';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { WorkoutSessionRepository } from '../db/repositories/workoutSessionRepository';

const workoutSessionRepository = new WorkoutSessionRepository();

export function ExerciseDetailScreen(): JSX.Element {
  const { exerciseId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const db = getDb();
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  const exercise = useLiveQuery(() => (exerciseId ? db.exercises.get(exerciseId) : undefined), [exerciseId]);
  const muscles = useLiveQuery(() => db.muscleGroups.toArray(), [], []);
  const history = useLiveQuery(() => (exerciseId ? db.setEntries.where('exerciseLocalId').equals(exerciseId).reverse().sortBy('completedAt') : Promise.resolve([])), [exerciseId], []);

  const primaryMuscle = useMemo(() => muscles.find((item) => item.localId === exercise?.primaryMuscleGroupLocalId)?.name ?? 'Targeted muscle', [muscles, exercise]);

  const addToWorkout = async () => {
    const sessionId = params.get('sessionId');
    if (!sessionId || !exercise) return;
    await workoutSessionRepository.addExerciseToSession(sessionId, exercise.localId, {});
    navigate(`/workout/active/${sessionId}`);
  };

  if (!exercise) {
    return <main className='wb-screen'><div className='wb-card'>Exercise not found.</div></main>;
  }

  return (
    <main className='wb-screen'>
      <section>
        <div className='wb-label'>{primaryMuscle}</div>
        <h1 className='wb-screen-title'>{exercise.name}</h1>
        <p className='wb-screen-subtitle'>Clean, glanceable detail views reduce friction when choosing or learning an exercise.[web:45][web:48]</p>
      </section>

      <div className='wb-row wb-segmented'>
        <button className={tab === 'overview' ? 'wb-chip-button active' : 'wb-chip-button'} onClick={() => setTab('overview')} style={{ padding: '0 16px' }}>Overview</button>
        <button className={tab === 'history' ? 'wb-chip-button active' : 'wb-chip-button'} onClick={() => setTab('history')} style={{ padding: '0 16px' }}>History</button>
      </div>

      {tab === 'overview' ? (
        <>
          <MuscleMap primaryMuscle={primaryMuscle} secondaryMuscles={['Stabilizers']} />
          <div className='wb-card wb-stack-md'>
            <h3 className='wb-section-title'>Coaching cues</h3>
            <ul className='wb-muted' style={{ margin: 0, paddingLeft: 18 }}>
              <li>Brace before the rep.</li>
              <li>Move through full controlled range.</li>
              <li>Finish strong without losing position.</li>
            </ul>
          </div>
          <div className='wb-card wb-stack-md'>
            <h3 className='wb-section-title'>Common mistakes</h3>
            <ul className='wb-muted' style={{ margin: 0, paddingLeft: 18 }}>
              <li>Rushing the eccentric.</li>
              <li>Letting setup break under fatigue.</li>
              <li>Counting sloppy reps as clean work.</li>
            </ul>
          </div>
          <div className='wb-card wb-stack-md'>
            <h3 className='wb-section-title'>Substitutions</h3>
            <div className='wb-row' style={{ flexWrap: 'wrap' }}>
              <div className='wb-pill'>Machine variation</div>
              <div className='wb-pill'>Dumbbell variation</div>
              <div className='wb-pill'>Cable variation</div>
            </div>
          </div>
        </>
      ) : (
        <div className='wb-card wb-stack-md'>
          <h3 className='wb-section-title'>Recent history</h3>
          {history.length ? history.slice(0, 8).map((item) => (
            <div key={item.localId} className='wb-row-between'>
              <div className='wb-muted'>{item.weightValue ?? 0} {item.weightUnit ?? 'kg'} × {item.reps ?? 0}</div>
              <div className='wb-faint'>{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'In session'}</div>
            </div>
          )) : <div className='wb-muted'>No logged sets yet.</div>}
        </div>
      )}

      {params.get('sessionId') ? <PrimaryButton fullWidth onClick={addToWorkout}>Add to workout</PrimaryButton> : null}
    </main>
  );
}
