import { getDb } from '../database';

export class ChallengeRepository {
  private db = getDb();
  async listActive() {
    return this.db.userChallenges.toArray();
  }
}
