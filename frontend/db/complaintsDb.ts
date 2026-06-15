import { getDb } from './database';

export type LocalComplaint = {
  id: string;
  ticketId?: string;
  rejectedBy?: { uid: string; name: string; reason: string; rejectedAt: string }[] | null;
  category?: string;
  subIssue?: string | null;
  customIssue?: string | null;
  description?: string;
  building?: string;
  roomDetail?: string;
  photoUrl?: string | null;
  status?: string;
  queueStatus?: string;
  submittedBy?: string;
  submittedByName?: string | null;
  submittedByRole?: string | null;
  submittedByEmail?: string | null;
  submittedByPhone?: string | null;
   assignedTo?: string | null;
  assignedToName?: string | null;
  assignedToPhone?: string | null;
  assignableTo?: string[] | null;
  rating?: number | null;
  ratingComment?: string | null;
  ratingDisabled?: boolean;
  flagged?: boolean;
  flagResolved?: boolean;
  flaggedAt?: any;
  flagReason?: string | null;
  flagResolvedAt?: any;
  flagResolvedBy?: string | null;
  adminHandling?: boolean;
  hodEmailSent?: boolean;
  hodEmailSentAt?: any;
  acceptedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  completedAt?: any;
};
const toSeconds = (ts: any): number | null => {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (ts._seconds) return ts._seconds;
  if (ts.seconds) return ts.seconds;
  if (typeof ts.toMillis === 'function') return ts.toMillis() / 1000;
  return null;
};

const fromRow = (row: any): LocalComplaint => ({
  ...row,
  assignableTo: row.assignableTo ? JSON.parse(row.assignableTo) : [],
  rejectedBy: row.rejectedBy ? JSON.parse(row.rejectedBy) : [],
  ratingDisabled: row.ratingDisabled === 1,
  flagged: row.flagged === 1,
  flagResolved: row.flagResolved === 1,
  adminHandling: row.adminHandling === 1,
  hodEmailSent: row.hodEmailSent === 1,
  rating: row.rating ?? null,
  createdAt: row.createdAt ? { _seconds: row.createdAt } : null,
  updatedAt: row.updatedAt ? { _seconds: row.updatedAt } : null,
  completedAt: row.completedAt ? { _seconds: row.completedAt } : null,
  acceptedAt: row.acceptedAt ? { _seconds: row.acceptedAt } : null,
  flaggedAt: row.flaggedAt ? { _seconds: row.flaggedAt } : null,
  flagResolvedAt: row.flagResolvedAt ? { _seconds: row.flagResolvedAt } : null,
  hodEmailSentAt: row.hodEmailSentAt ? { _seconds: row.hodEmailSentAt } : null,
});

export const upsertComplaints = async (complaints: LocalComplaint[]): Promise<void> => {
  const db = await getDb();
  for (const c of complaints) {
    await db.runAsync(
`INSERT OR REPLACE INTO complaints (
      id, ticketId, category, subIssue, customIssue, description,
        building, roomDetail, photoUrl, status, queueStatus,
        submittedBy, submittedByName, submittedByRole, submittedByEmail, submittedByPhone,
        assignedTo, assignedToName, assignedToPhone, assignableTo, rejectedBy,
        rating, ratingComment, ratingDisabled, flagResolvedBy,
        flagged, flagResolved, flaggedAt, flagReason, flagResolvedAt,
        adminHandling, hodEmailSent, hodEmailSentAt,
        acceptedAt, createdAt, updatedAt, completedAt, is_local, sync_status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,'synced')`,
      [
        c.id, c.ticketId ?? null, c.category ?? null,
        c.subIssue ?? null, c.customIssue ?? null, c.description ?? null,
        c.building ?? null, c.roomDetail ?? null, c.photoUrl ?? null,
        c.status ?? null, c.queueStatus ?? null, c.submittedBy ?? null,
        c.submittedByName ?? null, c.submittedByRole ?? null,
        c.submittedByEmail ?? null, c.submittedByPhone ?? null,
        c.assignedTo ?? null, c.assignedToName ?? null, c.assignedToPhone ?? null,
      c.assignableTo ? JSON.stringify(c.assignableTo) : null,
        c.rejectedBy ? JSON.stringify(c.rejectedBy) : null,
        c.rating ?? null,c.ratingComment ?? null,
        c.ratingDisabled ? 1 : 0, c.flagResolvedBy ?? null,
        c.flagged ? 1 : 0, c.flagResolved ? 1 : 0,
        toSeconds(c.flaggedAt), c.flagReason ?? null, toSeconds(c.flagResolvedAt),
        c.adminHandling ? 1 : 0, c.hodEmailSent ? 1 : 0, toSeconds(c.hodEmailSentAt),
        toSeconds(c.acceptedAt), toSeconds(c.createdAt), toSeconds(c.updatedAt), toSeconds(c.completedAt),
      ]
    );
  }
};

export const getComplaintsByUser = async (uid: string): Promise<LocalComplaint[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM complaints WHERE submittedBy = ? ORDER BY createdAt DESC',
    [uid]
  );
  return rows.map(fromRow);
};

export const getAllComplaintsLocal = async (): Promise<LocalComplaint[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM complaints ORDER BY createdAt DESC'
  );
  return rows.map(fromRow);
};

export const clearComplaints = async (): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM complaints');
};