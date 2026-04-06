import { getDb } from '../database';
import { createId } from '../../lib/id';
import { nowIso } from '../../lib/time';
import type { SessionSummaryCache } from '../../types/domain';

export class ScoreRepository {
  private db = getDb();

  async recomputeForSession(sessionId: string): Promise<void> {
    const session = await this.db.workoutSessions.get(sessionId);
    if (!session) return;
    const summary = session.summaryCacheJson;
    const totalScore = Math.round(100 + (summary?.totalWorkingSets ?? 0) * 8 + (summary?.totalVolumeKg ?? 0) / 120);
    await this.db.scoreHistory.put({
      localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'pending', revision: 1, serverRevision: null, lastSyncedAt: null, createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
      userLocalId: session.userLocalId, workoutSessionLocalId: sessionId,
      breakdown: { baseCompletion: 100, volumeQuality: Math.round((summary?.totalVolumeKg ?? 0) / 120), progression: 12, structure: 10, goalBonus: 0, streakBonus: 6, penalties: 0, totalScore, explanation: ['Completed session', 'Local score computed'] },
      scoreVersion: 1,
    });
    const nextSummary: SessionSummaryCache = {
      totalExercises: summary?.totalExercises ?? 0,
      totalCompletedExercises: summary?.totalCompletedExercises ?? 0,
      totalSets: summary?.totalSets ?? 0,
      totalWorkingSets: summary?.totalWorkingSets ?? 0,
      totalVolumeKg: summary?.totalVolumeKg ?? 0,
      durationMs: summary?.durationMs ?? 0,
      prCount: summary?.prCount ?? 0,
      scorePreview: totalScore,
      xpPreview: Math.round(totalScore * 0.4),
    };
    await this.db.workoutSessions.update(sessionId, { summaryCacheJson: nextSummary, updatedAt: nowIso() });
  }
}
