import Dexie from 'dexie';
import { getDb } from '../database';
import { createId } from '../../lib/id';
import { nowIso } from '../../lib/time';
import type { SessionSummaryCache, WorkoutSession, WorkoutSessionExercise } from '../../types/domain';

const emptySummary = (): SessionSummaryCache => ({
  totalExercises: 0,
  totalCompletedExercises: 0,
  totalSets: 0,
  totalWorkingSets: 0,
  totalVolumeKg: 0,
  durationMs: 0,
  prCount: 0,
  scorePreview: null,
  xpPreview: null,
});

export class WorkoutSessionRepository {
  private db = getDb();

  async getById(localId: string): Promise<WorkoutSession | undefined> {
    return this.db.workoutSessions.get(localId);
  }

  async getActiveSession(): Promise<WorkoutSession | undefined> {
    return this.db.workoutSessions.where('status').anyOf('active', 'paused').first();
  }

  async getSessionExercises(workoutSessionLocalId: string): Promise<WorkoutSessionExercise[]> {
    return this.db.workoutSessionExercises.where('[workoutSessionLocalId+sortOrder]').between([workoutSessionLocalId, Dexie.minKey], [workoutSessionLocalId, Dexie.maxKey]).toArray();
  }

  async createWorkoutSession(input: { userLocalId: string; templateLocalId: string | null; sessionNotes: string | null }): Promise<WorkoutSession> {
    const now = nowIso();
    const row: WorkoutSession = {
      localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'pending', revision: 1, serverRevision: null, lastSyncedAt: null, createdAt: now, updatedAt: now, deletedAt: null,
      userLocalId: input.userLocalId, templateLocalId: input.templateLocalId, status: 'active', startedAt: now, endedAt: null, pausedAt: null, resumedAt: null, sessionNotes: input.sessionNotes,
      activeElapsedMs: 0, totalPausedMs: 0, currentExerciseLocalId: null, summaryCacheJson: emptySummary(), restStartedAt: null, restTargetSeconds: null, restContextSetLocalId: null,
    };
    await this.db.workoutSessions.put(row);
    return row;
  }

  async addExerciseToSession(sessionId: string, exerciseId: string, options: { plannedSetCount?: number | null; defaultRestSeconds?: number | null }): Promise<WorkoutSessionExercise> {
    const now = nowIso();
    const sortOrder = (await this.db.workoutSessionExercises.where('workoutSessionLocalId').equals(sessionId).count()) + 1;
    const row: WorkoutSessionExercise = {
      localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'pending', revision: 1, serverRevision: null, lastSyncedAt: null, createdAt: now, updatedAt: now, deletedAt: null,
      workoutSessionLocalId: sessionId, exerciseLocalId: exerciseId, sortOrder, blockNotes: null, plannedSetCount: options.plannedSetCount ?? null, defaultRestSeconds: options.defaultRestSeconds ?? null,
      isCompleted: false, completedAt: null, isSuperset: false, supersetKey: null,
    };
    await this.db.workoutSessionExercises.put(row);
    await this.recomputeSessionSummary(sessionId);
    return row;
  }

  async recomputeSessionSummary(sessionId: string): Promise<void> {
    const session = await this.db.workoutSessions.get(sessionId);
    if (!session) return;
    const [blocks, sets] = await Promise.all([
      this.db.workoutSessionExercises.where('workoutSessionLocalId').equals(sessionId).toArray(),
      this.db.setEntries.where('workoutSessionLocalId').equals(sessionId).toArray(),
    ]);
    const visibleSets = sets.filter((set) => !set.isDeletedLogical);
    const workingSets = visibleSets.filter((set) => set.setType === 'working');
    const summary: SessionSummaryCache = {
      totalExercises: blocks.length,
      totalCompletedExercises: blocks.filter((block) => block.isCompleted).length,
      totalSets: visibleSets.length,
      totalWorkingSets: workingSets.length,
      totalVolumeKg: workingSets.reduce((sum, set) => sum + ((set.weightValue ?? 0) * (set.reps ?? 0)), 0),
      durationMs: (session.endedAt ? new Date(session.endedAt).getTime() : Date.now()) - new Date(session.startedAt).getTime(),
      prCount: session.summaryCacheJson?.prCount ?? 0,
      scorePreview: session.summaryCacheJson?.scorePreview ?? null,
      xpPreview: session.summaryCacheJson?.xpPreview ?? null,
    };
    await this.db.workoutSessions.update(sessionId, { summaryCacheJson: summary, updatedAt: nowIso() });
  }

  async completeSession(sessionId: string): Promise<void> {
    const endedAt = nowIso();
    await this.db.workoutSessions.update(sessionId, { status: 'completed', endedAt, updatedAt: endedAt, syncStatus: 'pending' });
    await this.recomputeSessionSummary(sessionId);
  }
}
