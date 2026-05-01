import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.STRAVA_DB_PATH ?? path.join(process.cwd(), "data", "strava.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

export function resetDb() {
  if (_db) _db.close();
  _db = null;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      sport_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      start_date_local TEXT,
      distance_m REAL NOT NULL DEFAULT 0,
      moving_time_s INTEGER NOT NULL DEFAULT 0,
      elapsed_time_s INTEGER NOT NULL DEFAULT 0,
      total_elevation_gain_m REAL NOT NULL DEFAULT 0,
      average_speed_mps REAL,
      max_speed_mps REAL,
      average_heartrate REAL,
      max_heartrate REAL,
      average_cadence REAL,
      average_watts REAL,
      kilojoules REAL,
      suffer_score INTEGER,
      kudos_count INTEGER DEFAULT 0,
      achievement_count INTEGER DEFAULT 0,
      gear_id TEXT,
      polyline TEXT,
      start_lat REAL,
      start_lng REAL,
      raw_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
    CREATE INDEX IF NOT EXISTS idx_activities_sport_start ON activities(sport_type, start_date);

    CREATE TABLE IF NOT EXISTS activity_streams (
      activity_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      data BLOB NOT NULL,
      PRIMARY KEY (activity_id, type),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS splits (
      activity_id INTEGER NOT NULL,
      split_index INTEGER NOT NULL,
      distance_m REAL,
      elapsed_time_s INTEGER,
      moving_time_s INTEGER,
      average_speed_mps REAL,
      average_heartrate REAL,
      elevation_diff_m REAL,
      PRIMARY KEY (activity_id, split_index),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      sport_type TEXT NOT NULL,
      distance_m INTEGER NOT NULL,
      activity_id INTEGER NOT NULL,
      time_s INTEGER NOT NULL,
      achieved_at TEXT NOT NULL,
      PRIMARY KEY (sport_type, distance_m),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      year INTEGER NOT NULL,
      sport_type TEXT NOT NULL,
      target_distance_m REAL,
      target_time_s INTEGER,
      PRIMARY KEY (year, sport_type)
    );
  `);
}
