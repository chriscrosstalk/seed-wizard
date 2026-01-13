-- Seed Wizard Initial Schema
-- Creates profiles, seeds, and zip_frost_data tables with RLS policies

-- =============================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  zip_code VARCHAR(10),
  hardiness_zone VARCHAR(5),
  last_frost_date DATE,
  first_frost_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SEEDS TABLE
-- Main seed inventory table
-- =============================================================================
CREATE TABLE seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

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
-- ZIP_FROST_DATA TABLE
-- Static lookup table for ZIP code to zone/frost date mapping
-- =============================================================================
CREATE TABLE zip_frost_data (
  zip_code VARCHAR(10) PRIMARY KEY,
  hardiness_zone VARCHAR(5),
  last_frost_date_avg DATE,
  first_frost_date_avg DATE,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  station_name TEXT
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_frost_data ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Seeds: users can only access their own
CREATE POLICY "Users can view own seeds" ON seeds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seeds" ON seeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seeds" ON seeds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own seeds" ON seeds
  FOR DELETE USING (auth.uid() = user_id);

-- ZIP frost data is publicly readable (no auth required)
CREATE POLICY "Frost data is publicly readable" ON zip_frost_data
  FOR SELECT USING (true);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_variety_name ON seeds(variety_name);
CREATE INDEX idx_seeds_common_name ON seeds(common_name);
CREATE INDEX idx_zip_frost_zone ON zip_frost_data(hardiness_zone);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PROFILE AUTO-CREATION
-- Automatically create a profile when a new user signs up
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
