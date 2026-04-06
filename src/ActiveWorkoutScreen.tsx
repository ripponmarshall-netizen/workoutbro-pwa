import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { RestTimer } from '../components/workout/RestTimer';
import { ExerciseBlock } from '../components/workout/ExerciseBlock';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { getDb } from '../db/database';

export function ActiveWorkoutScreen(): JSX.Element {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const activeWorkout = useActiveWorkout(sessionId);
  const [now, setNow] = useState(Date.now());
  const db = getDb();
  const muscles = useLiveQuery(() => db.muscleGroups.toArray(), [], []);
  const setHistory = useLiveQuery(() => db.setEntries.toArray(), [], []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const muscleMap = useMemo(() => Object.fromEntries(muscles.map((muscle) => [muscle.localId, muscle.name])), [muscles]);

  if (!activeWorkout.session) {
    return (
      <main className='wb-screen'>
        <div className='wb-card wb-stack-md'>
          <h1 className='wb-screen-title' style={{ fontSize: 30 }}>No active workout</h1>
          <Link to='/start-workout'>Start one now</Link>
        </div>
      </main>
    );
  }

  const finish = async () => {
    await activeWorkout.finishWorkout();
    navigate(`/workout/${activeWorkout.session?.localId}/summary`);
  };

  return (
    <main className='wb-screen'>
      <WorkoutHeader
        title={activeWorkout.session.templateLocalId ? 'Template session' : 'Active session'}
        startedAt={activeWorkout.session.startedAt}
        durationMs={now - new Date(activeWorkout.session.startedAt).getTime()}
        onFinish={finish}
      />

      <RestTimer startedAt={activeWorkout.session.restStartedAt} targetSeconds={activeWorkout.session.restTargetSeconds} />

      <div className='wb-row-between'>
        <h2 className='wb-section-title'>Exercises</h2>
        <Link to={`/workout/${activeWorkout.session.localId}/add-exercise`}>
          <PrimaryButton>Add exercise</PrimaryButton>
        </Link>
      </div>

      <section className='wb-list'>
        {activeWorkout.blocks.map((block) => {
          const exerciseSets = activeWorkout.sets.filter((set) => set.workoutSessionExerciseLocalId === block.localId && !set.isDeletedLogical);
          const recentPrs = activeWorkout.prs.filter((pr) => pr.exerciseLocalId === block.exerciseLocalId).slice(0, 2);
          const lastPerformance = setHistory
            .filter((set) => set.exerciseLocalId === block.exerciseLocalId && set.workoutSessionLocalId !== activeWorkout.session?.localId && set.isCompleted)
            .slice(-1)[0];

          return (
            <ExerciseBlock
              key={block.localId}
              block={block}
              exerciseName={activeWorkout.exerciseNameById[block.exerciseLocalId] ?? 'Exercise'}
              primaryMuscle={muscleMap[(activeWorkout.exercises.find((exercise) => exercise.localId === block.exerciseLocalId)?.primaryMuscleGroupLocalId ?? '')] ?? 'Muscle group'}
              previousPerformance={lastPerformance ? `${lastPerformance.weightValue ?? 0} ${lastPerformance.weightUnit ?? 'kg'} × ${lastPerformance.reps ?? 0}` : 'No previous data'}
              sets={exerciseSets}
              recentPrs={recentPrs}
              onQuickAdd={() => activeWorkout.addSet(block.localId, block.exerciseLocalId)}
              onCopyLast={() => activeWorkout.copyLastSet(block.localId, block.exerciseLocalId)}
              onUpdateSet={(setId, patch) => activeWorkout.updateSet(setId, patch)}
              onToggleComplete={(setId) => activeWorkout.toggleSetComplete(setId)}
            />
          );
        })}
      </section>

      {!activeWorkout.blocks.length ? (
        <div className='wb-card wb-card-elevated wb-stack-md' style={{ textAlign: 'center' }}>
          <div className='wb-muted'>Add your first exercise to start logging work.</div>
          <Link to={`/workout/${activeWorkout.session.localId}/add-exercise`}>
            <PrimaryButton>Add first exercise</PrimaryButton>
          </Link>
        </div>
      ) : null}
    </main>
  );
}
