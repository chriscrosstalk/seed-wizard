import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// =============================================================================
// PROFILES TABLE
// User settings including location and frost dates
// =============================================================================
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  display_name: text('display_name'),
  zip_code: text('zip_code'),
  hardiness_zone: text('hardiness_zone'),
  last_frost_date: text('last_frost_date'), // YYYY-MM-DD format
  first_frost_date: text('first_frost_date'), // YYYY-MM-DD format
  created_at: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

// =============================================================================
// SEEDS TABLE
// Main seed inventory with planting timing info
// =============================================================================
export const seeds = sqliteTable('seeds', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

  // Basic info (user-entered)
  variety_name: text('variety_name').notNull(),
  common_name: text('common_name'),
  seed_company: text('seed_company'),
  product_url: text('product_url'),
  image_url: text('image_url'),
  purchase_year: integer('purchase_year'),
  quantity_packets: integer('quantity_packets').notNull().default(1),
  notes: text('notes'),

  // Planting data (AI-extracted or user-entered)
  days_to_maturity_min: integer('days_to_maturity_min'),
  days_to_maturity_max: integer('days_to_maturity_max'),
  planting_depth_inches: real('planting_depth_inches'),
  spacing_inches: integer('spacing_inches'),
  row_spacing_inches: integer('row_spacing_inches'),
  sun_requirement: text('sun_requirement'), // 'full_sun' | 'partial_shade' | 'shade'
  water_requirement: text('water_requirement'), // 'low' | 'medium' | 'high'

  // Planting strategy
  planting_method: text('planting_method'), // 'direct_sow' | 'start_indoors'
  weeks_before_last_frost: integer('weeks_before_last_frost'),
  weeks_after_last_frost: integer('weeks_after_last_frost'),
  cold_hardy: integer('cold_hardy', { mode: 'boolean' }).notNull().default(false),
  weeks_before_last_frost_outdoor: integer('weeks_before_last_frost_outdoor'),
  succession_planting: integer('succession_planting', { mode: 'boolean' }).notNull().default(false),
  succession_interval_days: integer('succession_interval_days'),
  fall_planting: integer('fall_planting', { mode: 'boolean' }).notNull().default(false),
  cold_stratification_required: integer('cold_stratification_required', { mode: 'boolean' }).notNull().default(false),
  cold_stratification_weeks: integer('cold_stratification_weeks'),

  // Status flags
  is_favorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  is_planted: integer('is_planted', { mode: 'boolean' }).notNull().default(false),

  // AI metadata
  ai_extracted: integer('ai_extracted', { mode: 'boolean' }).notNull().default(false),
  ai_extraction_date: text('ai_extraction_date'),
  raw_ai_response: text('raw_ai_response'), // JSON string

  created_at: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updated_at: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

// =============================================================================
// ZIP_FROST_DATA TABLE
// Static lookup table for ZIP code to zone/frost date mapping
// =============================================================================
export const zipFrostData = sqliteTable('zip_frost_data', {
  zip_code: text('zip_code').primaryKey(),
  hardiness_zone: text('hardiness_zone'),
  last_frost_date_avg: text('last_frost_date_avg'), // YYYY-MM-DD format
  first_frost_date_avg: text('first_frost_date_avg'), // YYYY-MM-DD format
  latitude: real('latitude'),
  longitude: real('longitude'),
  station_name: text('station_name'),
})

// Type exports for use in the app
export type ProfileRow = typeof profiles.$inferSelect
export type ProfileInsert = typeof profiles.$inferInsert
export type SeedRow = typeof seeds.$inferSelect
export type SeedInsert = typeof seeds.$inferInsert
export type ZipFrostDataRow = typeof zipFrostData.$inferSelect
