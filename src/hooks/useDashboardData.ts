import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';

export function useDashboardData() {
  const db = getDb();

  return useLiveQuery(async () => {
    const [activeSession, recentSessions, prs, scores, exercises, goals] = await Promise.all([
      db.workoutSessions.where('status').anyOf('active', 'paused').first(),
      db.workoutSessions.orderBy('startedAt').reverse().limit(8).toArray(),
      db.personalRecords.orderBy('achievedAt').reverse().limit(4).toArray(),
      db.scoreHistory.orderBy('createdAt').reverse().limit(20).toArray(),
      db.exercises.toArray(),
      db.goals.limit(3).toArray(),
    ]);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const trainedThisWeek = recentSessions.filter((session) => new Date(session.startedAt) >= weekStart).length;
    const weeklyVolume = recentSessions
      .filter((session) => new Date(session.startedAt) >= weekStart)
      .reduce((sum, session) => sum + (session.summaryCacheJson?.totalVolumeKg ?? 0), 0);
    const totalXp = scores.reduce((sum, item) => sum + (item.breakdown.totalScore ?? 0), 0);
    const level = Math.max(1, Math.floor(totalXp / 250) + 1);
    const streakDays = Math.max(0, Math.min(14, recentSessions.length ? recentSessions.length + 1 : 0));

    return {
      activeSession,
      recentSessions,
      prs,
      exerciseNameById: Object.fromEntries(exercises.map((exercise) => [exercise.localId, exercise.name])),
      goals,
      trainedThisWeek,
      weeklyVolume,
      totalXp,
      level,
      rankLabel: level >= 15 ? 'Elite' : level >= 10 ? 'Diamond' : level >= 6 ? 'Gold' : 'Bronze',
      lastWorkout: recentSessions[0] ?? null,
      streakDays,
    };
  }, [], {
    activeSession: null,
    recentSessions: [],
    prs: [],
    exerciseNameById: {},
    goals: [],
    trainedThisWeek: 0,
    weeklyVolume: 0,
    totalXp: 0,
    level: 1,
    rankLabel: 'Bronze',
    lastWorkout: null,
    streakDays: 0,
  });
}
