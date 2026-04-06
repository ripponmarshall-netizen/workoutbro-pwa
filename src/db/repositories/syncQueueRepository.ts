import Dexie from 'dexie';
import { getDb } from '../database';
import { nowIso } from '../../lib/time';
import type { EntityType, MutationType, SyncLogEntry, SyncQueueItem, UUID } from '../../types/domain';

export class SyncQueueRepository {
  private db = getDb();

  async enqueue(item: SyncQueueItem): Promise<void> {
    await this.db.syncQueue.add(item);
  }

  async bulkEnqueue(items: SyncQueueItem[]): Promise<void> {
    if (!items.length) return;
    await this.db.syncQueue.bulkAdd(items);
  }

  async getNextBatch(limit: number, now: string): Promise<SyncQueueItem[]> {
    return this.db.syncQueue
      .where('[status+priority+createdAt]')
      .between(['pending', Dexie.minKey, Dexie.minKey], ['pending', Dexie.maxKey, Dexie.maxKey])
      .filter((row) => !row.nextRetryAt || row.nextRetryAt <= now)
      .limit(limit)
      .toArray();
  }

  async listPending(): Promise<SyncQueueItem[]> {
    return this.db.syncQueue.where('status').anyOf('pending', 'retry_scheduled', 'processing').toArray();
  }

  async listFailed(): Promise<SyncQueueItem[]> {
    return this.db.syncQueue.where('status').anyOf('failed', 'dead_letter').toArray();
  }

  async dedupePending(
    entityType: EntityType,
    entityLocalId: UUID,
    mutationType: MutationType,
    requestHash: string | null,
  ): Promise<SyncQueueItem | undefined> {
    const items = await this.db.syncQueue.where('[entityType+entityLocalId]').equals([entityType, entityLocalId]).toArray();
    return items.find((item) => item.status === 'pending' && item.mutationType === mutationType && item.requestHash === requestHash);
  }

  async markProcessing(ids: UUID[]): Promise<void> {
    const ts = nowIso();
    await this.db.transaction('rw', this.db.syncQueue, async () => {
      for (const id of ids) {
        await this.db.syncQueue.update(id, { status: 'processing', updatedAt: ts, lastAttemptAt: ts });
      }
    });
  }

  async markMutationAttempt(id: UUID): Promise<void> {
    const current = await this.db.syncQueue.get(id);
    if (!current) return;
    await this.db.syncQueue.update(id, {
      attemptCount: current.attemptCount + 1,
      lastAttemptAt: nowIso(),
      updatedAt: nowIso(),
      status: 'processing',
    });
  }

  async markMutationSuccess(id: UUID, logEntry: SyncLogEntry): Promise<void> {
    await this.db.transaction('rw', this.db.syncQueue, this.db.syncLog, async () => {
      await this.db.syncQueue.delete(id);
      await this.db.syncLog.add(logEntry);
    });
  }

  async markMutationFailure(id: UUID, error: string, nextRetryAt: string | null, deadLetter = false): Promise<void> {
    await this.db.syncQueue.update(id, {
      status: deadLetter ? 'dead_letter' : nextRetryAt ? 'retry_scheduled' : 'failed',
      lastError: error,
      nextRetryAt,
      updatedAt: nowIso(),
    });
  }
}
