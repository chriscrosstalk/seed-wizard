import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

// Database file location - can be overridden by environment variable
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'seed-wizard.db')

// Ensure the data directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Create SQLite connection
const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL')

// Create Drizzle instance
export const db = drizzle(sqlite, { schema })

// Export schema for use elsewhere
export { schema }

// Initialize database tables if they don't exist
export function initializeDatabase() {
  sqlite.exec(`
    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      zip_code TEXT,
      hardiness_zone TEXT,
      last_frost_date TEXT,
      first_frost_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Seeds table
    CREATE TABLE IF NOT EXISTS seeds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      variety_name TEXT NOT NULL,
      common_name TEXT,
      seed_company TEXT,
      product_url TEXT,
      image_url TEXT,
      purchase_year INTEGER,
      quantity_packets INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      days_to_maturity_min INTEGER,
      days_to_maturity_max INTEGER,
      planting_depth_inches REAL,
      spacing_inches INTEGER,
      row_spacing_inches INTEGER,
      sun_requirement TEXT,
      water_requirement TEXT,
      planting_method TEXT,
      weeks_before_last_frost INTEGER,
      weeks_after_last_frost INTEGER,
      cold_hardy INTEGER NOT NULL DEFAULT 0,
      weeks_before_last_frost_outdoor INTEGER,
      succession_planting INTEGER NOT NULL DEFAULT 0,
      succession_interval_days INTEGER,
      fall_planting INTEGER NOT NULL DEFAULT 0,
      cold_stratification_required INTEGER NOT NULL DEFAULT 0,
      cold_stratification_weeks INTEGER,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_planted INTEGER NOT NULL DEFAULT 0,
      ai_extracted INTEGER NOT NULL DEFAULT 0,
      ai_extraction_date TEXT,
      raw_ai_response TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ZIP frost data table
    CREATE TABLE IF NOT EXISTS zip_frost_data (
      zip_code TEXT PRIMARY KEY,
      hardiness_zone TEXT,
      last_frost_date_avg TEXT,
      first_frost_date_avg TEXT,
      latitude REAL,
      longitude REAL,
      station_name TEXT
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
    CREATE INDEX IF NOT EXISTS idx_seeds_variety_name ON seeds(variety_name);
    CREATE INDEX IF NOT EXISTS idx_seeds_common_name ON seeds(common_name);
    CREATE INDEX IF NOT EXISTS idx_zip_frost_zone ON zip_frost_data(hardiness_zone);
    CREATE INDEX IF NOT EXISTS idx_seeds_is_favorite ON seeds(is_favorite) WHERE is_favorite = 1;
    CREATE INDEX IF NOT EXISTS idx_seeds_is_planted ON seeds(is_planted) WHERE is_planted = 1;

    -- Create default profile for dev mode (matching Supabase dev user)
    INSERT OR IGNORE INTO profiles (id, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', datetime('now'), datetime('now'));
  `)
}

// Generate a UUID v4
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Get current ISO timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}
