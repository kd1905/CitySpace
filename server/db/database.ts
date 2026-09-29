import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';

// Load .env variables into process.env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  }
}

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: DatabaseSync | null = null;
let activeEngine: 'mysql' | 'sqlite' = 'sqlite';

export async function initDatabase(): Promise<void> {
  const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.DB_NAME || 'cityspace';

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';

  if (DB_TYPE === 'mysql') {
    const passwordCandidates = [DB_PASSWORD];
    if (DB_PASSWORD.includes('%')) {
      try {
        const decoded = decodeURIComponent(DB_PASSWORD);
        if (decoded !== DB_PASSWORD) {
          passwordCandidates.push(decoded);
        }
      } catch {}
    }

    let connected = false;
    for (const pwd of passwordCandidates) {
      try {
        console.log(`[Database] Attempting MySQL connection to ${DB_USER}@${DB_HOST}:${DB_PORT}...`);

        // 1. First connect without db to ensure database exists
        const initConn = await mysql.createConnection({
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: pwd,
          multipleStatements: true,
        });

        await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await initConn.end();

        // 2. Create connection pool with target database
        mysqlPool = mysql.createPool({
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: pwd,
          database: DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          multipleStatements: true,
        });
        connected = true;
        break;
      } catch (err: any) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR' && passwordCandidates.length > 1) {
          continue;
        }
        throw err;
      }
    }

    if (connected && mysqlPool) {
      try {
        // 3. Test connection & execute schema
        const conn = await mysqlPool.getConnection();
        console.log(`[Database] Successfully connected to MySQL database: ${DB_NAME}`);

        if (schemaSql) {
          // Filter out SQLite specific commands if any, or run statements
          const cleanSchema = schemaSql.replace(/--[^\r\n]*/g, '');
          const statements = cleanSchema
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          for (const statement of statements) {
            try {
              let sqlToRun = statement;
              if (/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+/i.test(sqlToRun)) {
                sqlToRun = sqlToRun.replace(/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+/i, 'CREATE INDEX ');
              }
              await conn.query(sqlToRun);
            } catch (stmtErr: any) {
              if (
                !stmtErr.message.includes('already exists') &&
                !stmtErr.message.includes('Duplicate key') &&
                stmtErr.code !== 'ER_DUP_KEYNAME'
              ) {
                console.warn(`[Database] Schema notice:`, stmtErr.message);
              }
            }
          }
          // Ensure new columns on existing tables
          const safeAddColumns = [
            `ALTER TABLE properties ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'draft'`,
            `ALTER TABLE properties ADD COLUMN verification_notes TEXT`,
            `ALTER TABLE properties ADD COLUMN rejection_reason TEXT`,
            `ALTER TABLE enquiries ADD COLUMN pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'new'`,
            `ALTER TABLE enquiries ADD COLUMN buyer_budget VARCHAR(100)`,
            `ALTER TABLE enquiries ADD COLUMN buyer_location VARCHAR(150)`,
            `ALTER TABLE enquiries ADD COLUMN notes TEXT`,
            `ALTER TABLE enquiries ADD COLUMN follow_up_date VARCHAR(64)`,
            `ALTER TABLE users ADD COLUMN password VARCHAR(255)`,
            `ALTER TABLE agents ADD COLUMN password VARCHAR(255) DEFAULT 'agent123'`,
            `ALTER TABLE agents ADD COLUMN city VARCHAR(100)`,
            `ALTER TABLE agents ADD COLUMN role VARCHAR(50) DEFAULT 'agent'`,
            `ALTER TABLE agents ADD COLUMN requires_password_change TINYINT(1) DEFAULT 1`,
            // site_visits new columns
            `ALTER TABLE site_visits ADD COLUMN alt_slot_1_date VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN alt_slot_1_time VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN alt_slot_2_date VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN alt_slot_2_time VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN confirmed_date VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN confirmed_time VARCHAR(64)`,
            `ALTER TABLE site_visits ADD COLUMN rejection_reason TEXT`,
            `ALTER TABLE site_visits ADD COLUMN reschedule_reason TEXT`,
            // notifications new columns
            `ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(50) NOT NULL DEFAULT 'admin'`,
            `ALTER TABLE notifications ADD COLUMN recipient_id VARCHAR(64)`,
            `ALTER TABLE notifications ADD COLUMN visit_id VARCHAR(64)`,
          ];
          for (const colSql of safeAddColumns) {
            try {
              await conn.query(colSql);
            } catch {}
          }

          console.log(`[Database] MySQL schema verified and ready.`);
        }
        conn.release();
        activeEngine = 'mysql';
        return;
      } catch (err: any) {
        console.warn(`[Database] Error during MySQL initialization:`, err.message);
      }
    } else {
      console.warn(`\n[Database WARNING] Could not connect to MySQL at ${DB_HOST}:${DB_PORT} with user "${DB_USER}".`);
      console.warn(`Please check your DB_HOST, DB_USER, DB_PASSWORD in .env.\nFalling back to local SQLite engine so server stays operational.\n`);
    }
  }

  // Fallback to SQLite
  const dbPathSetting = process.env.DB_PATH || 'database/cityspace.db';
  const resolvedDbPath = path.isAbsolute(dbPathSetting)
    ? dbPathSetting
    : path.resolve(process.cwd(), dbPathSetting);

  const dbDir = path.dirname(resolvedDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(resolvedDbPath);
  console.log(`[Database] Connected to SQLite database at: ${resolvedDbPath}`);

  if (schemaSql) {
    sqliteDb.exec(schemaSql);
    const safeAddColumnsSqlite = [
      `ALTER TABLE properties ADD COLUMN verification_status VARCHAR(50) DEFAULT 'draft'`,
      `ALTER TABLE properties ADD COLUMN verification_notes TEXT`,
      `ALTER TABLE properties ADD COLUMN rejection_reason TEXT`,
      `ALTER TABLE enquiries ADD COLUMN pipeline_stage VARCHAR(50) DEFAULT 'new'`,
      `ALTER TABLE enquiries ADD COLUMN buyer_budget VARCHAR(100)`,
      `ALTER TABLE enquiries ADD COLUMN buyer_location VARCHAR(150)`,
      `ALTER TABLE enquiries ADD COLUMN notes TEXT`,
      `ALTER TABLE enquiries ADD COLUMN follow_up_date VARCHAR(64)`,
      `ALTER TABLE users ADD COLUMN password VARCHAR(255)`,
      `ALTER TABLE agents ADD COLUMN password VARCHAR(255)`,
      `ALTER TABLE agents ADD COLUMN city VARCHAR(100)`,
      `ALTER TABLE agents ADD COLUMN role VARCHAR(50) DEFAULT 'agent'`,
      `ALTER TABLE agents ADD COLUMN requires_password_change TINYINT(1) DEFAULT 1`,
      // site_visits new columns
      `ALTER TABLE site_visits ADD COLUMN alt_slot_1_date VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN alt_slot_1_time VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN alt_slot_2_date VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN alt_slot_2_time VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN confirmed_date VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN confirmed_time VARCHAR(64)`,
      `ALTER TABLE site_visits ADD COLUMN rejection_reason TEXT`,
      `ALTER TABLE site_visits ADD COLUMN reschedule_reason TEXT`,
      // notifications new columns
      `ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(50) DEFAULT 'admin'`,
      `ALTER TABLE notifications ADD COLUMN recipient_id VARCHAR(64)`,
      `ALTER TABLE notifications ADD COLUMN visit_id VARCHAR(64)`,
    ];
    for (const sql of safeAddColumnsSqlite) {
      try { sqliteDb.exec(sql); } catch {}
    }
    console.log('[Database] SQLite schema verified.');
  }
  activeEngine = 'sqlite';
}

export function getActiveEngine(): 'mysql' | 'sqlite' {
  return activeEngine;
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T[];
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  return [];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    const arr = rows as any[];
    return arr.length > 0 ? (arr[0] as T) : null;
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.get(...params);
    return (result as T) || null;
  }
  return null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ changes: number | bigint; lastInsertRowid: number | bigint }> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [result] = await mysqlPool.execute(sql, params);
    const res = result as any;
    return {
      changes: res.affectedRows || 0,
      lastInsertRowid: res.insertId || 0,
    };
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const res = stmt.run(...params);
    return {
      changes: res.changes,
      lastInsertRowid: res.lastInsertRowid,
    };
  }
  return { changes: 0, lastInsertRowid: 0 };
}
