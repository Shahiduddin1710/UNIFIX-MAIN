import { getDb } from './database';

export type LocalLostFoundItem = {
  id: string;
  itemName?: string;
  category?: string;
  description?: string;
  roomNumber?: string;
  roomLabel?: string;
  collectLocation?: string;
  photoUrl?: string | null;
  postedBy?: string;
  postedByName?: string;
  postedByRole?: string;
  status?: string;
  handedToName?: string | null;
  handedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  isMyPost?: boolean;
};

export type LocalLostReport = {
  id: string;
  itemName?: string;
  category?: string;
  description?: string;
  locationLost?: string;
  dateLost?: string;
  howToReach?: string;
  images?: string[];
  postedByUid?: string;
  postedByName?: string;
  postedByRole?: string;
  postedAt?: any;
  status?: string;
  isMyPost?: boolean;
};

export type LocalClaim = {
  id: string;
  itemName?: string;
  photoUrl?: string | null;
  handedByName?: string;
  handedByRole?: string;
  handedToName?: string;
  roomNumber?: string;
  roomLabel?: string;
  collectLocation?: string;
  handedAt?: any;
  createdAt?: any;
};

const toSeconds = (ts: any): number | null => {
  if (!ts) return null;
  if (typeof ts === 'number') return ts > 1e10 ? Math.floor(ts / 1000) : ts;
  if (ts._seconds) return ts._seconds;
  if (ts.seconds) return ts.seconds;
  if (typeof ts.toMillis === 'function') return Math.floor(ts.toMillis() / 1000);
  return null;
};

export const initLostFoundTables = async (): Promise<void> => {
  // Tables are created in database.ts to avoid circular dependency
  return;
};

export const upsertLostFoundItems = async (items: LocalLostFoundItem[]): Promise<void> => {
  const db = await getDb();
  for (const i of items) {
    await db.runAsync(
      `INSERT OR REPLACE INTO lostfound_items
        (id, itemName, category, description, roomNumber, roomLabel, collectLocation,
        photoUrl, postedBy, postedByName, postedByRole, status, handedToName,
        handedAt, createdAt, updatedAt, isMyPost)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        i.id, i.itemName ?? null, i.category ?? null, i.description ?? null,
        i.roomNumber ?? null, i.roomLabel ?? null, i.collectLocation ?? null,
        i.photoUrl ?? null, i.postedBy ?? null, i.postedByName ?? null,
        i.postedByRole ?? null, i.status ?? null, i.handedToName ?? null,
        toSeconds(i.handedAt), toSeconds(i.createdAt), toSeconds(i.updatedAt),
        i.isMyPost ? 1 : 0,
      ]
    );
  }
};

export const clearLostReports = async (): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM lost_reports`);
};

export const upsertLostReports = async (reports: LocalLostReport[]): Promise<void> => {
  const db = await getDb();
  for (const r of reports) {
    await db.runAsync(
      `INSERT OR REPLACE INTO lost_reports
        (id, itemName, category, description, locationLost, dateLost, howToReach,
        images, postedByUid, postedByName, postedByRole, postedAt, status, isMyPost)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        r.id, r.itemName ?? null, r.category ?? null, r.description ?? null,
        r.locationLost ?? null, r.dateLost ?? null, r.howToReach ?? null,
        r.images ? JSON.stringify(r.images) : null,
        (r.postedByUid ?? (r as any).postedBy?.uid ?? null),
        (r.postedByName ?? (r as any).postedBy?.name ?? null),
        (r.postedByRole ?? (r as any).postedBy?.role ?? null),
        toSeconds(r.postedAt), r.status ?? null, r.isMyPost ? 1 : 0,
      ]
    );
  }
};

export const upsertClaims = async (claims: LocalClaim[]): Promise<void> => {
  const db = await getDb();
  for (const c of claims) {
    await db.runAsync(
      `INSERT OR REPLACE INTO claims
        (id, itemName, photoUrl, handedByName, handedByRole, handedToName,
        roomNumber, roomLabel, collectLocation, handedAt, createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        c.id, c.itemName ?? null, c.photoUrl ?? null,
        c.handedByName ?? null, c.handedByRole ?? null, c.handedToName ?? null,
        c.roomNumber ?? null, c.roomLabel ?? null, c.collectLocation ?? null,
        toSeconds(c.handedAt), toSeconds(c.createdAt),
      ]
    );
  }
};

const fromLFRow = (row: any): LocalLostFoundItem => ({
  ...row,
  isMyPost: row.isMyPost === 1,
  createdAt: row.createdAt ? { _seconds: row.createdAt } : null,
  updatedAt: row.updatedAt ? { _seconds: row.updatedAt } : null,
  handedAt: row.handedAt ? { _seconds: row.handedAt } : null,
});

const fromReportRow = (row: any): LocalLostReport => ({
  ...row,
  isMyPost: row.isMyPost === 1,
  images: row.images ? JSON.parse(row.images) : [],
  postedAt: row.postedAt ? { _seconds: row.postedAt } : null,
});

const fromClaimRow = (row: any): LocalClaim => ({
  ...row,
  handedAt: row.handedAt ? { _seconds: row.handedAt } : null,
  createdAt: row.createdAt ? { _seconds: row.createdAt } : null,
});

export const getLostFoundFeed = async (): Promise<LocalLostFoundItem[]> => {
  const db = await getDb();
  await db.execAsync(`
    UPDATE lostfound_items 
    SET createdAt = createdAt / 1000 
    WHERE createdAt > 1000000000000
  `);
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM lostfound_items ORDER BY createdAt DESC`
  );
  return rows.map(fromLFRow);
};

export const getMyLostFoundPosts = async (uid: string): Promise<LocalLostFoundItem[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM lostfound_items WHERE postedBy = ? ORDER BY createdAt DESC`,
    [uid]
  );
  return rows.map(fromLFRow);
};

export const getLostReports = async (): Promise<LocalLostReport[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM lost_reports WHERE status IN ('active', 'found') ORDER BY postedAt DESC`
  );
  return rows.map(fromReportRow);
};

export const getMyLostReports = async (uid: string): Promise<LocalLostReport[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM lost_reports WHERE postedByUid = ? ORDER BY postedAt DESC`,
    [uid]
  );
  return rows.map(fromReportRow);
};

export const deleteLostReportsByIds = async (ids: string[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  const db = await getDb();
  for (const id of ids) {
    await db.runAsync(`DELETE FROM lost_reports WHERE id = ?`, [id]);
  }
};

export const deleteLostReportById = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM lost_reports WHERE id = ?`, [id]);
};

export const deleteLostFoundItemById = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM lostfound_items WHERE id = ?`, [id]);
};

export const getAllClaims = async (): Promise<LocalClaim[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM claims ORDER BY createdAt DESC`
  );
  return rows.map(fromClaimRow);
};