import { getDb } from '../database';

export class ExerciseRepository {
  private db = getDb();
  async getById(localId: string) { return this.db.exercises.get(localId); }
  async listAll() { return this.db.exercises.orderBy('name').toArray(); }
  async searchByName(query: string) {
    const q = query.trim().toLowerCase();
    const all = await this.listAll();
    return q ? all.filter((row) => row.name.toLowerCase().includes(q)) : all;
  }
}