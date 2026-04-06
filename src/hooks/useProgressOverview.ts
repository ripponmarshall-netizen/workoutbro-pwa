import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';

export function useProgressOverview() {
  const db = getDb();

  return useLiveQuery(async () => {
    const [sessions, prs, exercises] = await Promise.all([
      db.workoutSessions.orderBy('startedAt').reverse().limit(24).toArray(),
      db.personalRecords.orderBy('achievedAt').reverse().limit(12).toArray(),
      db.exercises.toArray(),
    ]);

    const monthlyVolume = sessions.slice(0, 12).reduce((sum, session) => sum + (session.summaryCacheJson?.totalVolumeKg ?? 0), 0);
    const weeklyVolume = sessions.slice(0, 7).reduce((sum, session) => sum + (session.summaryCacheJson?.totalVolumeKg ?? 0), 0);
    const lifetimeVolume = sessions.reduce((sum, session) => sum + (session.summaryCacheJson?.totalVolumeKg ?? 0), 0);
    const chartPoints = sessions.slice(0, 6).reverse().map((session) => ({
      label: new Date(session.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: Math.round(session.summaryCacheJson?.totalVolumeKg ?? 0),
    }));

    const exerciseNameById = Object.fromEntries(exercises.map((exercise) => [exercise.localId, exercise.name]));
    const improvingLifts = prs.slice(0, 5).map((pr) => ({
      label: exerciseNameById[pr.exerciseLocalId] ?? 'Exercise',
      value: pr.valueNumeric,
    }));

    return {
      sessions,
      prs,
      weeklyVolume,
      monthlyVolume,
      lifetimeVolume,
      chartPoints,
      improvingLifts,
      exerciseNameById,
    };
  }, [], {
    sessions: [],
    prs: [],
    weeklyVolume: 0,
    monthlyVolume: 0,
    lifetimeVolume: 0,
    chartPoints: [],
    improvingLifts: [],
    exerciseNameById: {},
  });
}
