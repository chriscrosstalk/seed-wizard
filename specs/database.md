# Seed Wizard - Database Schema

## Overview
Supabase (PostgreSQL) with Row Level Security for multi-user isolation.

## Tables

### profiles
Extends Supabase auth.users with app-specific data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  zip_code VARCHAR(10),
  hardiness_zone VARCHAR(5),        -- e.g., "7b", "8a"
  last_frost_date DATE,             -- Average last spring frost
  first_frost_date DATE,            -- Average first fall frost
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### seeds
Main seed inventory table.

```sql
CREATE TABLE seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic info (user-entered)
  variety_name TEXT NOT NULL,       -- e.g., "Brandywine"
  common_name TEXT,                 -- e.g., "Tomato"
  seed_company TEXT,                -- e.g., "Johnny's Selected Seeds"
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
  sun_requirement TEXT,             -- 'full_sun', 'partial_shade', 'shade'
  water_requirement TEXT,           -- 'low', 'medium', 'high'

  -- Planting strategy
  planting_method TEXT,             -- 'direct_sow', 'start_indoors', 'both'
  weeks_before_last_frost INTEGER,  -- For indoor starts
  weeks_after_last_frost INTEGER,   -- For direct sow after frost
  cold_hardy BOOLEAN DEFAULT FALSE, -- Can be planted before last frost
  weeks_before_last_frost_outdoor INTEGER, -- For cold hardy direct sow
  succession_planting BOOLEAN DEFAULT FALSE,
  succession_interval_days INTEGER,
  fall_planting BOOLEAN DEFAULT FALSE,
  cold_stratification_required BOOLEAN DEFAULT FALSE,
  cold_stratification_weeks INTEGER,

  -- AI metadata
  ai_extracted BOOLEAN DEFAULT FALSE,
  ai_extraction_date TIMESTAMPTZ,
  raw_ai_response JSONB,            -- Store full AI response for debugging

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### zip_frost_data
Static lookup table for ZIP code to zone/frost date mapping.

```sql
CREATE TABLE zip_frost_data (
  zip_code VARCHAR(10) PRIMARY KEY,
  hardiness_zone VARCHAR(5),
  last_frost_date_avg DATE,         -- Average last spring frost (MM-DD stored as date in year 2000)
  first_frost_date_avg DATE,        -- Average first fall frost
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  station_name TEXT                 -- Weather station used for data
);
```

## Row Level Security Policies

```sql
-- Enable RLS
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

-- ZIP frost data is publicly readable
CREATE POLICY "Frost data is publicly readable" ON zip_frost_data
  FOR SELECT USING (true);
```

## Indexes

```sql
-- Optimize common queries
CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_variety_name ON seeds(variety_name);
CREATE INDEX idx_seeds_common_name ON seeds(common_name);
CREATE INDEX idx_zip_frost_zone ON zip_frost_data(hardiness_zone);
```

## Data Sources for zip_frost_data

1. **USDA Hardiness Zones**:
   - Frostline API: https://github.com/waldoj/frostline
   - Returns zone by ZIP code

2. **Frost Dates**:
   - NOAA Climate Normals data
   - Dave's Garden frost date database
   - Will need to compile or import CSV

## Migration Strategy

1. Create initial schema in `supabase/migrations/001_initial_schema.sql`
2. Import frost data in `supabase/migrations/002_seed_frost_data.sql`
3. Run migrations via Supabase CLI or dashboard

## Local Development

For Phase 1 (local MVP), can use:
- Supabase local development with `supabase start`
- Or connect to free Supabase cloud project

## TypeScript Types

Generate types from schema:
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

Or define manually in `src/types/database.ts` based on this schema.
