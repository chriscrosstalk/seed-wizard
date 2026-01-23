/**
 * Migration script to export data from Supabase and import into local SQLite
 *
 * Usage:
 *   1. Set environment variables:
 *      - SUPABASE_URL (your Supabase project URL)
 *      - SUPABASE_SERVICE_KEY (service role key for full access)
 *
 *   2. Run the script:
 *      npx tsx scripts/migrate-from-supabase.ts
 *
 * This will:
 *   - Connect to your Supabase database
 *   - Export all seeds and profile data
 *   - Import into the local SQLite database at data/seed-wizard.db
 */

import { createClient } from '@supabase/supabase-js'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'seed-wizard.db')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or anon key) must be set')
  console.error('')
  console.error('Example:')
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/migrate-from-supabase.ts')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Create SQLite database
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')

// Initialize tables
function initializeTables() {
  sqlite.exec(`
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

    CREATE TABLE IF NOT EXISTS zip_frost_data (
      zip_code TEXT PRIMARY KEY,
      hardiness_zone TEXT,
      last_frost_date_avg TEXT,
      first_frost_date_avg TEXT,
      latitude REAL,
      longitude REAL,
      station_name TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
    CREATE INDEX IF NOT EXISTS idx_seeds_variety_name ON seeds(variety_name);
    CREATE INDEX IF NOT EXISTS idx_seeds_common_name ON seeds(common_name);
    CREATE INDEX IF NOT EXISTS idx_zip_frost_zone ON zip_frost_data(hardiness_zone);
  `)
}

async function migrateProfiles() {
  console.log('Fetching profiles from Supabase...')
  const { data: profiles, error } = await supabase.from('profiles').select('*')

  if (error) {
    console.error('Error fetching profiles:', error.message)
    return 0
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found in Supabase')
    return 0
  }

  const insertProfile = sqlite.prepare(`
    INSERT OR REPLACE INTO profiles (
      id, display_name, zip_code, hardiness_zone,
      last_frost_date, first_frost_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMany = sqlite.transaction((profiles: any[]) => {
    for (const p of profiles) {
      insertProfile.run(
        p.id,
        p.display_name,
        p.zip_code,
        p.hardiness_zone,
        p.last_frost_date,
        p.first_frost_date,
        p.created_at,
        p.updated_at
      )
    }
  })

  insertMany(profiles)
  console.log(`Migrated ${profiles.length} profile(s)`)
  return profiles.length
}

async function migrateSeeds() {
  console.log('Fetching seeds from Supabase...')
  const { data: seeds, error } = await supabase.from('seeds').select('*')

  if (error) {
    console.error('Error fetching seeds:', error.message)
    return 0
  }

  if (!seeds || seeds.length === 0) {
    console.log('No seeds found in Supabase')
    return 0
  }

  const insertSeed = sqlite.prepare(`
    INSERT OR REPLACE INTO seeds (
      id, user_id, variety_name, common_name, seed_company, product_url, image_url,
      purchase_year, quantity_packets, notes, days_to_maturity_min, days_to_maturity_max,
      planting_depth_inches, spacing_inches, row_spacing_inches, sun_requirement,
      water_requirement, planting_method, weeks_before_last_frost, weeks_after_last_frost,
      cold_hardy, weeks_before_last_frost_outdoor, succession_planting, succession_interval_days,
      fall_planting, cold_stratification_required, cold_stratification_weeks, is_favorite,
      is_planted, ai_extracted, ai_extraction_date, raw_ai_response, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMany = sqlite.transaction((seeds: any[]) => {
    for (const s of seeds) {
      insertSeed.run(
        s.id,
        s.user_id,
        s.variety_name,
        s.common_name,
        s.seed_company,
        s.product_url,
        s.image_url,
        s.purchase_year,
        s.quantity_packets ?? 1,
        s.notes,
        s.days_to_maturity_min,
        s.days_to_maturity_max,
        s.planting_depth_inches,
        s.spacing_inches,
        s.row_spacing_inches,
        s.sun_requirement,
        s.water_requirement,
        s.planting_method,
        s.weeks_before_last_frost,
        s.weeks_after_last_frost,
        s.cold_hardy ? 1 : 0,
        s.weeks_before_last_frost_outdoor,
        s.succession_planting ? 1 : 0,
        s.succession_interval_days,
        s.fall_planting ? 1 : 0,
        s.cold_stratification_required ? 1 : 0,
        s.cold_stratification_weeks,
        s.is_favorite ? 1 : 0,
        s.is_planted ? 1 : 0,
        s.ai_extracted ? 1 : 0,
        s.ai_extraction_date,
        s.raw_ai_response ? JSON.stringify(s.raw_ai_response) : null,
        s.created_at,
        s.updated_at
      )
    }
  })

  insertMany(seeds)
  console.log(`Migrated ${seeds.length} seed(s)`)
  return seeds.length
}

async function migrateZipFrostData() {
  console.log('Fetching ZIP frost data from Supabase...')
  const { data: zipData, error } = await supabase.from('zip_frost_data').select('*')

  if (error) {
    console.error('Error fetching ZIP frost data:', error.message)
    return 0
  }

  if (!zipData || zipData.length === 0) {
    console.log('No ZIP frost data found in Supabase')
    return 0
  }

  const insertZip = sqlite.prepare(`
    INSERT OR REPLACE INTO zip_frost_data (
      zip_code, hardiness_zone, last_frost_date_avg, first_frost_date_avg,
      latitude, longitude, station_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMany = sqlite.transaction((zipData: any[]) => {
    for (const z of zipData) {
      insertZip.run(
        z.zip_code,
        z.hardiness_zone,
        z.last_frost_date_avg,
        z.first_frost_date_avg,
        z.latitude,
        z.longitude,
        z.station_name
      )
    }
  })

  insertMany(zipData)
  console.log(`Migrated ${zipData.length} ZIP frost record(s)`)
  return zipData.length
}

async function main() {
  console.log('=== Supabase to SQLite Migration ===')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`SQLite path: ${DB_PATH}`)
  console.log('')

  console.log('Initializing SQLite tables...')
  initializeTables()

  const profileCount = await migrateProfiles()
  const seedCount = await migrateSeeds()
  const zipCount = await migrateZipFrostData()

  console.log('')
  console.log('=== Migration Complete ===')
  console.log(`Profiles: ${profileCount}`)
  console.log(`Seeds: ${seedCount}`)
  console.log(`ZIP frost records: ${zipCount}`)
  console.log('')
  console.log(`Database saved to: ${DB_PATH}`)

  sqlite.close()
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
