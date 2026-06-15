import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    db = await SQLite.openDatabaseAsync('unifix.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await initTables(db);
 await migrateComplaintsTable(db);
    await initLostFoundTablesInline(db);
    dbInitPromise = null;
    return db;
  })();
  return dbInitPromise;
};
const migrateComplaintsTable = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(complaints);`
  );
  const existing = new Set(columns.map((c) => c.name));

 const requiredColumns: { name: string; def: string }[] = [
    { name: 'rejectedBy', def: 'TEXT' },
    { name: 'submittedByName', def: 'TEXT' },
    { name: 'submittedByRole', def: 'TEXT' },
    { name: 'submittedByEmail', def: 'TEXT' },
    { name: 'submittedByPhone', def: 'TEXT' },
    { name: 'assignedToName', def: 'TEXT' },
     { name: 'assignedToPhone', def: 'TEXT' },
    { name: 'assignableTo', def: 'TEXT' },
    { name: 'ratingComment', def: 'TEXT' },
    { name: 'ratingDisabled', def: 'INTEGER DEFAULT 0' },
    { name: 'flagResolvedBy', def: 'TEXT' },
    { name: 'flagged', def: 'INTEGER DEFAULT 0' },
    { name: 'flagResolved', def: 'INTEGER DEFAULT 0' },
    { name: 'flaggedAt', def: 'INTEGER' },
    { name: 'flagReason', def: 'TEXT' },
    { name: 'flagResolvedAt', def: 'INTEGER' },
    { name: 'adminHandling', def: 'INTEGER DEFAULT 0' },
    { name: 'hodEmailSent', def: 'INTEGER DEFAULT 0' },
    { name: 'hodEmailSentAt', def: 'INTEGER' },
    { name: 'acceptedAt', def: 'INTEGER' },
    { name: 'completedAt', def: 'INTEGER' },
    { name: 'is_local', def: "INTEGER DEFAULT 0" },
    { name: 'sync_status', def: "TEXT DEFAULT 'synced'" },
  ];

  for (const col of requiredColumns) {
    if (!existing.has(col.name)) {
      // console.log(`[db] adding missing column complaints.${col.name}`);
      await db.execAsync(`ALTER TABLE complaints ADD COLUMN ${col.name} ${col.def};`);
    }
  }
};

const initTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      ticketId TEXT,
      category TEXT,
      subIssue TEXT,
      customIssue TEXT,
      description TEXT,
      building TEXT,
      roomDetail TEXT,
      photoUrl TEXT,
      status TEXT,
      queueStatus TEXT,
      submittedBy TEXT,
     assignedTo TEXT,
      assignedToName TEXT,
      assignedToPhone TEXT,
      assignableTo TEXT,
      rating REAL,
      ratingComment TEXT,
      ratingDisabled INTEGER DEFAULT 0,
     flagResolvedBy TEXT,
      flagged INTEGER DEFAULT 0,
      flagResolved INTEGER DEFAULT 0,
      flaggedAt INTEGER,
      flagReason TEXT,
      flagResolvedAt INTEGER,
      adminHandling INTEGER DEFAULT 0,
      hodEmailSent INTEGER DEFAULT 0,
      hodEmailSentAt INTEGER,
      submittedByName TEXT,
      submittedByRole TEXT,
      submittedByEmail TEXT,
      submittedByPhone TEXT,
      acceptedAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER,
      completedAt INTEGER,
      is_local INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_complaints_submittedBy
    ON complaints (submittedBy, updatedAt);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_complaints_status
    ON complaints (status);
  `);
};

const initLostFoundTablesInline = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lostfound_items (
      id TEXT PRIMARY KEY,
      itemName TEXT,
      category TEXT,
      description TEXT,
      roomNumber TEXT,
      roomLabel TEXT,
      collectLocation TEXT,
      photoUrl TEXT,
      postedBy TEXT,
      postedByName TEXT,
      postedByRole TEXT,
      status TEXT,
      handedToName TEXT,
      handedAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER,
      isMyPost INTEGER DEFAULT 0
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lost_reports (
      id TEXT PRIMARY KEY,
      itemName TEXT,
      category TEXT,
      description TEXT,
      locationLost TEXT,
      dateLost TEXT,
      howToReach TEXT,
      images TEXT,
      postedByUid TEXT,
      postedByName TEXT,
      postedByRole TEXT,
      postedAt INTEGER,
      status TEXT,
      isMyPost INTEGER DEFAULT 0
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      itemName TEXT,
      photoUrl TEXT,
      handedByName TEXT,
      handedByRole TEXT,
      handedToName TEXT,
      roomNumber TEXT,
      roomLabel TEXT,
      collectLocation TEXT,
      handedAt INTEGER,
      createdAt INTEGER
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_lostfound_status ON lostfound_items (status, updatedAt);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_lostfound_postedBy ON lostfound_items (postedBy);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_lostreports_status ON lost_reports (status, postedAt);`);
};

export const resetDb = async (): Promise<void> => {
  const database = await getDb();
 await database.execAsync('DROP TABLE IF EXISTS complaints;');
  await database.execAsync('DROP TABLE IF EXISTS metadata;');
  await database.execAsync('DROP TABLE IF EXISTS lostfound_items;');
  await database.execAsync('DROP TABLE IF EXISTS lost_reports;');
  await database.execAsync('DROP TABLE IF EXISTS claims;');
  db = null;
  await getDb();
};