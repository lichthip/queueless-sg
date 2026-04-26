import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/queueless.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS centers (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      type             TEXT    NOT NULL CHECK(type IN ('polyclinic','ICA','HDB','CDC','CPF')),
      address          TEXT    NOT NULL,
      lat              REAL    NOT NULL,
      lng              REAL    NOT NULL,
      capacity         INTEGER NOT NULL DEFAULT 100,
      operating_hours  TEXT    NOT NULL DEFAULT '8:00 AM – 5:30 PM'
    );

    CREATE TABLE IF NOT EXISTS queue_states (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id            INTEGER NOT NULL UNIQUE,
      current_count        INTEGER NOT NULL DEFAULT 0,
      serving_number       INTEGER NOT NULL DEFAULT 0,
      avg_service_minutes  REAL    NOT NULL DEFAULT 8.0,
      is_open              INTEGER NOT NULL DEFAULT 1,
      updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS queue_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id   INTEGER NOT NULL,
      count       INTEGER NOT NULL,
      recorded_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      center_id     INTEGER,
      role          TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('staff','admin')),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_queue_history_center_time
      ON queue_history(center_id, recorded_at);
  `);
}

export default db;