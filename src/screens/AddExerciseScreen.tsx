import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExerciseFilters } from '../components/exercises/ExerciseFilters';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { useExerciseLibrary } from '../hooks/useExerciseLibrary';
import { WorkoutSessionRepository } from '../db/repositories/workoutSessionRepository';
import { getDb } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

const workoutSessionRepository = new WorkoutSessionRepository();

export function AddExerciseScreen(): JSX.Element {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { query, setQuery, filter, setFilter, exercises } = useExerciseLibrary();
  const db = getDb();
  const muscles = useLiveQuery(() => db.muscleGroups.toArray(), [], []);
  const equipment = useLiveQuery(() => db.equipmentTypes.toArray(), [], []);

  const muscleMap = Object.fromEntries(muscles.map((item) => [item.localId, item.name]));
  const equipmentMap = Object.fromEntries(equipment.map((item) => [item.localId, item.name]));

  const addExercise = async (exerciseId: string) => {
    if (!sessionId) return;
    await workoutSessionRepository.addExerciseToSession(sessionId, exerciseId, {});
    navigate(`/workout/active/${sessionId}`);
  };

  return (
    <main className='wb-screen'>
      <section>
        <h1 className='wb-screen-title'>Add exercise</h1>
        <p className='wb-screen-subtitle'>Find the lift, add it, keep moving.</p>
      </section>

      <ExerciseFilters search={query} onSearchChange={setQuery} selectedFilter={filter} onFilterChange={setFilter} />

      <section className='wb-list'>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.localId}
            exercise={exercise}
            equipmentLabel={exercise.defaultEquipmentLocalId ? equipmentMap[exercise.defaultEquipmentLocalId] : undefined}
            muscleLabel={exercise.primaryMuscleGroupLocalId ? muscleMap[exercise.primaryMuscleGroupLocalId] : undefined}
            onQuickAdd={() => addExercise(exercise.localId)}
          />
        ))}
      </section>
    </main>
  );
}
