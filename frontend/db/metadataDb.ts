import { getDb } from './database';

export const getMeta = async (key: string): Promise<string | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
};

export const setMeta = async (key: string, value: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    [key, value]
  );
};