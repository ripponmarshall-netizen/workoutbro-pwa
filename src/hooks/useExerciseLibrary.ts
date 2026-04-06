import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExerciseRepository } from '../db/repositories/exerciseRepository';
import { getDb } from '../db/database';

const exerciseRepository = new ExerciseRepository();

export function useExerciseLibrary() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const db = getDb();

  const exercises = useLiveQuery(async () => {
    const results = query ? await exerciseRepository.searchByName(query) : await exerciseRepository.listAll();
    if (filter === 'all') return results;
    return results.filter((exercise) => exercise.slug.includes(filter) || exercise.name.toLowerCase().includes(filter));
  }, [query, filter], []);

  const recentExercises = useLiveQuery(() => db.workoutSessionExercises.orderBy('updatedAt').reverse().limit(6).toArray(), [], []);

  const [exerciseNameToId, setExerciseNameToId] = useState<Record<string, string>>({});
  useEffect(() => {
    const map = Object.fromEntries((exercises ?? []).map((exercise) => [exercise.name, exercise.localId]));
    setExerciseNameToId(map);
  }, [exercises]);

  return {
    query,
    setQuery,
    filter,
    setFilter,
    exercises: exercises ?? [],
    recentExercises: recentExercises ?? [],
    exerciseNameToId,
  };
}
