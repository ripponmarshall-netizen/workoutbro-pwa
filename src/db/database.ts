import { AppDatabase } from './schema';

let db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!db) db = new AppDatabase();
  return db;
}
