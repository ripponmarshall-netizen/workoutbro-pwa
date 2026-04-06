import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';
import { WorkoutSessionRepository } from '../db/repositories/workoutSessionRepository';
import { SetEntryRepository } from '../db/repositories/setEntryRepository';
import { PersonalRecordRepository } from '../db/repositories/personalRecordRepository';
import { ScoreRepository } from '../db/repositories/scoreRepository';

const workoutSessionRepository = new WorkoutSessionRepository();
const setEntryRepository = new SetEntryRepository();
const personalRecordRepository = new PersonalRecordRepository();
const scoreRepository = new ScoreRepository();

export function useActiveWorkout(sessionId?: string) {
  const db = getDb();

  const data = useLiveQuery(async () => {
    const session = sessionId
      ? await workoutSessionRepository.getById(sessionId)
      : await workoutSessionRepository.getActiveSession();
    if (!session) {
      return {
        session: null,
        blocks: [],
        sets: [],
        exercises: [],
        prs: [],
      };
    }

    const [blocks, sets, exercises, prs] = await Promise.all([
      workoutSessionRepository.getSessionExercises(session.localId),
      db.setEntries.where('workoutSessionLocalId').equals(session.localId).sortBy('setNumber'),
      db.exercises.toArray(),
      db.personalRecords.orderBy('achievedAt').reverse().limit(20).toArray(),
    ]);

    return { session, blocks, sets, exercises, prs };
  }, [sessionId], {
    session: null,
    blocks: [],
    sets: [],
    exercises: [],
    prs: [],
  });

  const exerciseNameById = useMemo(
    () => Object.fromEntries((data?.exercises ?? []).map((exercise) => [exercise.localId, exercise.name])),
    [data?.exercises],
  );

  return {
    ...(data ?? { session: null, blocks: [], sets: [], exercises: [], prs: [] }),
    exerciseNameById,
    async addSet(workoutSessionExerciseLocalId: string, exerciseLocalId: string) {
      const session = data?.session;
      if (!session) return;
      await setEntryRepository.addSet({
        workoutSessionLocalId: session.localId,
        workoutSessionExerciseLocalId,
        exerciseLocalId,
        setType: 'working',
        setNumber: (data?.sets.filter((set) => set.workoutSessionExerciseLocalId === workoutSessionExerciseLocalId).length ?? 0) + 1,
      });
    },
    async updateSet(setId: string, patch: Record<string, unknown>) {
      await setEntryRepository.updateSet(setId, patch);
    },
    async toggleSetComplete(setId: string) {
      const target = data?.sets.find((set) => set.localId === setId);
      if (!target) return;
      await setEntryRepository.updateSet(setId, {
        isCompleted: !target.isCompleted,
        completedAt: !target.isCompleted ? new Date().toISOString() : null,
      });
    },
    async copyLastSet(workoutSessionExerciseLocalId: string, exerciseLocalId: string) {
      const relevant = (data?.sets ?? []).filter((set) => set.workoutSessionExerciseLocalId === workoutSessionExerciseLocalId);
      const last = relevant[relevant.length - 1];
      if (!last || !data?.session) return;
      await setEntryRepository.addSet({
        workoutSessionLocalId: data.session.localId,
        workoutSessionExerciseLocalId,
        exerciseLocalId,
        setType: last.setType,
        setNumber: relevant.length + 1,
        weightValue: last.weightValue,
        weightUnit: last.weightUnit,
        reps: last.reps,
      });
    },
    async finishWorkout() {
      const session = data?.session;
      if (!session) return;
      await workoutSessionRepository.completeSession(session.localId);
      await scoreRepository.recomputeForSession(session.localId);
      await personalRecordRepository.refreshForSession(session.localId);
    },
  };
}
