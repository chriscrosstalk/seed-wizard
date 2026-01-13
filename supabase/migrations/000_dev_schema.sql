-- Seed Wizard Development Schema (No Auth Required)
-- Use this for local development. Use 001_initial_schema.sql for production.

-- =============================================================================
-- SEEDS TABLE (simplified - no user reference for dev)
-- =============================================================================
CREATE TABLE IF NOT EXISTS seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional for dev, will be enforced in production

  -- Basic info (user-entered)
  variety_name TEXT NOT NULL,
  common_name TEXT,
  seed_company TEXT,
  product_url TEXT,
  purchase_year INTEGER,
  quantity_packets INTEGER DEFAULT 1,
  notes TEXT,

  -- Planting data (AI-extracted or user-entered)
  days_to_maturity_min INTEGER,
  days_to_maturity_max INTEGER,
  planting_depth_inches DECIMAL(4,2),
  spacing_inches INTEGER,
  row_spacing_inches INTEGER,
  sun_requirement TEXT,
  water_requirement TEXT,

  -- Planting strategy
  planting_method TEXT,
  weeks_before_last_frost INTEGER,
  weeks_after_last_frost INTEGER,
  cold_hardy BOOLEAN DEFAULT FALSE,
  weeks_before_last_frost_outdoor INTEGER,
  succession_planting BOOLEAN DEFAULT FALSE,
  succession_interval_days INTEGER,
  fall_planting BOOLEAN DEFAULT FALSE,
  cold_stratification_required BOOLEAN DEFAULT FALSE,
  cold_stratification_weeks INTEGER,

  -- AI metadata
  ai_extracted BOOLEAN DEFAULT FALSE,
  ai_extraction_date TIMESTAMPTZ,
  raw_ai_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROFILES TABLE (simplified for dev)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  zip_code VARCHAR(10),
  hardiness_zone VARCHAR(5),
  last_frost_date DATE,
  first_frost_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ZIP_FROST_DATA TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS zip_frost_data (
  zip_code VARCHAR(10) PRIMARY KEY,
  hardiness_zone VARCHAR(5),
  last_frost_date_avg DATE,
  first_frost_date_avg DATE,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  station_name TEXT
);

-- =============================================================================
-- DISABLE RLS FOR DEVELOPMENT
-- =============================================================================
ALTER TABLE seeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE zip_frost_data DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE DEFAULT DEV PROFILE
-- =============================================================================
INSERT INTO profiles (id, display_name, zip_code, hardiness_zone)
VALUES ('00000000-0000-0000-0000-000000000000', 'Dev User', '12345', '6a')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_variety_name ON seeds(variety_name);
CREATE INDEX IF NOT EXISTS idx_seeds_common_name ON seeds(common_name);
CREATE INDEX IF NOT EXISTS idx_zip_frost_zone ON zip_frost_data(hardiness_zone);
