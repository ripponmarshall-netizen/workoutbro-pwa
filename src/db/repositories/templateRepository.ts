import Dexie from 'dexie';
import { getDb } from '../database';

export class TemplateRepository {
  private db = getDb();
  async listRecent(userLocalId: string, limit = 8) {
    return this.db.workoutTemplates.where('userLocalId').equals(userLocalId).reverse().limit(limit).toArray();
  }
  async getExercises(templateLocalId: string) {
    return this.db.templateExercises.where('[templateLocalId+sortOrder]').between([templateLocalId, Dexie.minKey], [templateLocalId, Dexie.maxKey]).toArray();
  }
}
