import { getDb } from '../database';
import { createId } from '../../lib/id';
import { nowIso } from '../../lib/time';
import type { PersonalRecord } from '../../types/domain';

export class PersonalRecordRepository {
  private db = getDb();

  async getCurrentPrsForExercise(exerciseLocalId: string): Promise<PersonalRecord[]> {
    return this.db.personalRecords.where('exerciseLocalId').equals(exerciseLocalId).toArray();
  }

  async refreshForSession(sessionId: string): Promise<void> {
    const session = await this.db.workoutSessions.get(sessionId);
    if (!session) return;
    const sets = await this.db.setEntries.where('workoutSessionLocalId').equals(sessionId).toArray();
    const grouped = new Map<string, SetEntry[]>();
    sets.filter((set) => set.isCompleted && !set.isDeletedLogical).forEach((set) => {
      const arr = grouped.get(set.exerciseLocalId) ?? [];
      arr.push(set as any);
      grouped.set(set.exerciseLocalId, arr);
    });
    for (const [exerciseLocalId, group] of grouped.entries()) {
      const maxLoad = group.reduce((max, set: any) => Math.max(max, set.weightValue ?? 0), 0);
      const current = await this.db.personalRecords.where('[exerciseLocalId+prType]').equals([exerciseLocalId, 'max_load']).first();
      if (!current || current.valueNumeric < maxLoad) {
        await this.db.personalRecords.put({
          localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'pending', revision: 1, serverRevision: null, lastSyncedAt: null, createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
          userLocalId: session.userLocalId, exerciseLocalId, prType: 'max_load', valueNumeric: maxLoad, valueUnit: 'kg', sourceSetLocalId: null, sourceWorkoutSessionLocalId: sessionId, achievedAt: nowIso(), verifiedByServer: false,
        });
      }
    }
  }
}

type SetEntry = { exerciseLocalId: string; weightValue: number | null; isCompleted: boolean; isDeletedLogical: boolean };
