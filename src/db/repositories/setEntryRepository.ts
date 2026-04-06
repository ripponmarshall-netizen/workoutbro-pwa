import { getDb } from '../database';
import { createId } from '../../lib/id';
import { nowIso } from '../../lib/time';
import type { SetEntry, SetType, WeightUnit } from '../../types/domain';
import { WorkoutSessionRepository } from './workoutSessionRepository';

const workoutSessionRepository = new WorkoutSessionRepository();

export class SetEntryRepository {
  private db = getDb();

  async addSet(input: {
    workoutSessionLocalId: string;
    workoutSessionExerciseLocalId: string;
    exerciseLocalId: string;
    setNumber: number;
    setType?: SetType;
    weightValue?: number | null;
    weightUnit?: WeightUnit | null;
    reps?: number | null;
  }): Promise<SetEntry> {
    const now = nowIso();
    const row: SetEntry = {
      localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'pending', revision: 1, serverRevision: null, lastSyncedAt: null, createdAt: now, updatedAt: now, deletedAt: null,
      workoutSessionLocalId: input.workoutSessionLocalId, workoutSessionExerciseLocalId: input.workoutSessionExerciseLocalId, exerciseLocalId: input.exerciseLocalId,
      setNumber: input.setNumber, setType: input.setType ?? 'working', weightValue: input.weightValue ?? null, weightUnit: input.weightUnit ?? 'kg', reps: input.reps ?? null,
      rir: null, rpe: null, durationSeconds: null, distanceValue: null, distanceUnit: null, isCompleted: false, completedAt: null, notes: null, supersedesSetLocalId: null, isDeletedLogical: false,
    };
    await this.db.setEntries.put(row);
    await workoutSessionRepository.recomputeSessionSummary(input.workoutSessionLocalId);
    return row;
  }

  async updateSet(localId: string, patch: Partial<SetEntry>): Promise<void> {
    const existing = await this.db.setEntries.get(localId);
    if (!existing) return;
    await this.db.setEntries.update(localId, { ...patch, updatedAt: nowIso(), syncStatus: 'pending' });
    await workoutSessionRepository.recomputeSessionSummary(existing.workoutSessionLocalId);
  }

  async findLastPerformanceForExercise(exerciseLocalId: string) {
    const rows = await this.db.setEntries.where('exerciseLocalId').equals(exerciseLocalId).toArray();
    return rows.filter((row) => row.isCompleted && !row.isDeletedLogical).sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];
  }
}
