import { getDb } from '../db/database';
import { minutesSince } from '../lib/time';

export async function getActiveWorkoutRecoveryState() {
  const db = getDb();
  const session = await db.workoutSessions.where('status').anyOf('active', 'paused').first();
  if (!session) return { hasRecoverableSession: false, session: null, isStale: false };
  return {
    hasRecoverableSession: true,
    session,
    isStale: minutesSince(session.updatedAt) > 180,
  };
}
