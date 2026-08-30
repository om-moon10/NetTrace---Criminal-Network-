import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from './seed';

let dbInstance: SqlJsDatabase | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'nettrace.db');
const TMP_DB_PATH = path.join('/tmp', 'nettrace.db');

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure data directory exists if filesystem is writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (_) {
    // In read-only environments, continue gracefully
  }

  const SQL = await initSqlJs();

  // Try loading from primary path or fallback path
  let loadedFromDisk = false;
  const candidatePaths = [DB_PATH, TMP_DB_PATH];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      try {
        const fileBuffer = fs.readFileSync(candidatePath);
        if (fileBuffer.length > 0) {
          const testDb = new SQL.Database(fileBuffer);
          testDb.exec('SELECT 1;');
          dbInstance = testDb;
          loadedFromDisk = true;
          break;
        }
      } catch (e) {
        console.warn(`[NetTrace] Failed to load ${candidatePath} (corrupted/incompatible), trying next:`, e);
      }
    }
  }

  if (!loadedFromDisk || !dbInstance) {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  
  // Guarantee demo investigation NX-102 is present
  seedDatabase(dbInstance);

  saveDb(dbInstance);

  return dbInstance;
}

export function saveDb(db?: SqlJsDatabase): void {
  const target = db || dbInstance;
  if (!target) return;
  try {
    const data = target.export();
    const buffer = Buffer.from(data);

    let saved = false;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, buffer);
      saved = true;
    } catch (_) {
      // Primary DB_PATH is likely on a read-only filesystem (e.g. Vercel serverless / AWS Lambda)
    }

    if (!saved) {
      try {
        fs.writeFileSync(TMP_DB_PATH, buffer);
      } catch (_) {
        // Fallback: database remains safely in-memory for this instance
      }
    }
  } catch (e) {
    console.error('[NetTrace] Failed to export SQLite database:', e);
  }
}

function initTables(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS investigations (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE',
      lead_investigator TEXT,
      agency TEXT,
      classification TEXT DEFAULT 'TLP:AMBER',
      total_monitored_funds_usd REAL DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      investigation_id TEXT NOT NULL,
      label TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      threat_level TEXT DEFAULT 'medium',
      role TEXT DEFAULT 'unknown',
      risk_score INTEGER DEFAULT 50,
      confidence_score INTEGER DEFAULT 80,
      cluster_id TEXT,
      metadata TEXT,
      created_at TEXT,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      investigation_id TEXT NOT NULL,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT,
      value REAL DEFAULT 0,
      confidence INTEGER DEFAULT 85,
      protocol TEXT,
      timestamp TEXT,
      notes TEXT,
      created_at TEXT,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (source) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      investigation_id TEXT NOT NULL,
      entity_id TEXT,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      title TEXT,
      raw_content TEXT,
      extracted_indicators TEXT,
      confidence_weight INTEGER DEFAULT 85,
      timestamp TEXT,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      investigation_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      entity_ids TEXT,
      category TEXT DEFAULT 'transaction',
      severity TEXT DEFAULT 'medium',
      amount_usd REAL,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );
  `);

  try {
    db.run(`ALTER TABLE relationships ADD COLUMN created_at TEXT;`);
  } catch (e) {
    // Column may already exist
  }

  try {
    db.run(`ALTER TABLE evidence ADD COLUMN title TEXT;`);
  } catch (e) {
    // Column may already exist
  }
}

// Database helper functions for convenience
export function queryAll<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDb(db);
}
