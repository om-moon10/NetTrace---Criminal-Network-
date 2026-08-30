import { createClient, Client, InValue, ResultSet } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from './seed';

let clientInstance: Client | null = null;
let initPromise: Promise<Client> | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'nettrace.db');

/**
 * Returns the singleton libSQL / Turso database client.
 * In production (Vercel), connects to Turso via TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
 * In local development without Turso credentials, automatically falls back to local SQLite (file:data/nettrace.db).
 */
export async function getDb(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl) {
      console.log(`[NetTrace Database] Connecting to Turso Cloud database (${tursoUrl.split('?')[0]})...`);
      clientInstance = createClient({
        url: tursoUrl,
        authToken: tursoAuthToken || undefined,
      });
    } else {
      // Local fallback using file: SQLite
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
      } catch (_) {}

      console.log(`[NetTrace Database] TURSO_DATABASE_URL not set; using local libSQL file storage (file:${DB_PATH})`);
      clientInstance = createClient({
        url: `file:${DB_PATH}`,
      });
    }

    // Ensure database tables exist
    await initTables(clientInstance);

    // Guarantee authoritative demo investigation NX-102 is present
    await seedDatabase(clientInstance);

    return clientInstance;
  })();

  return initPromise;
}

/**
 * Creates required tables if they don't already exist.
 */
async function initTables(db: Client): Promise<void> {
  const tableStatements = [
    `CREATE TABLE IF NOT EXISTS investigations (
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
    );`,
    `CREATE TABLE IF NOT EXISTS entities (
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
    );`,
    `CREATE TABLE IF NOT EXISTS relationships (
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
    );`,
    `CREATE TABLE IF NOT EXISTS evidence (
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
    );`,
    `CREATE TABLE IF NOT EXISTS timeline_events (
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
    );`,
  ];

  for (const stmt of tableStatements) {
    try {
      await db.execute(stmt);
    } catch (e: any) {
      console.warn(`[NetTrace Database] Schema init warning:`, e.message);
    }
  }
}

/**
 * Executes a query returning all rows as plain JavaScript objects.
 */
export async function queryAll<T = any>(db: Client, sql: string, params: InValue[] = []): Promise<T[]> {
  const rs = await db.execute({ sql, args: params });
  return rs.rows.map((row) => ({ ...row })) as unknown as T[];
}

/**
 * Executes a query returning the first row as a plain JavaScript object or null.
 */
export async function queryOne<T = any>(db: Client, sql: string, params: InValue[] = []): Promise<T | null> {
  const rs = await db.execute({ sql, args: params });
  if (rs.rows.length === 0) return null;
  return { ...rs.rows[0] } as unknown as T;
}

/**
 * Executes a SQL statement (INSERT, UPDATE, DELETE).
 */
export async function execute(db: Client, sql: string, params: InValue[] = []): Promise<ResultSet> {
  return await db.execute({ sql, args: params });
}

/**
 * Safe no-op for libSQL / Turso storage compatibility.
 */
export function saveDb(_db?: Client): void {
  // No-op: libSQL commits writes immediately to the remote/local database
}
