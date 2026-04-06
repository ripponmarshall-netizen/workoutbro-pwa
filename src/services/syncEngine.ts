import { getDb } from '../db/database';
import { buildRequestHash, createId, createIdempotencyKey } from '../lib/id';
import { computeRetryAt, nowIso } from '../lib/time';
import type { EntityType, MutationType, SyncQueueItem } from '../types/domain';

export class SyncEngine {
  private db = getDb();

  async enqueueMutation(entityType: EntityType, entityLocalId: string, mutationType: MutationType, payload: Record<string, unknown>) {
    const row: SyncQueueItem = {
      id: createId(),
      entityType,
      entityLocalId,
      entityServerId: null,
      mutationType,
      payload,
      idempotencyKey: createIdempotencyKey(entityType),
      dependencyKey: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      attemptCount: 0,
      nextRetryAt: null,
      status: 'pending',
      priority: 1,
      lastError: null,
      lastAttemptAt: null,
      requestHash: buildRequestHash(payload),
    };
    await this.db.syncQueue.put(row);
    return row;
  }

  async flushPending() {
    const items = await this.db.syncQueue.where('status').anyOf('pending', 'retry_scheduled').toArray();
    for (const item of items) {
      await this.db.syncQueue.update(item.id, { status: 'completed', updatedAt: nowIso(), attemptCount: item.attemptCount + 1, lastAttemptAt: nowIso(), nextRetryAt: computeRetryAt(item.attemptCount + 1) });
    }
  }
}
