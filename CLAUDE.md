# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Seed Wizard is a Next.js 16 application that helps gardeners track seed inventory and generate personalized planting calendars based on their location (ZIP code → USDA zone → frost dates).

**Key Features:**
- Seed inventory management with manual entry and AI-powered URL extraction
- Planting calendar calculations based on user's frost dates
- Claude API integration for extracting seed data from product page URLs
- Local SQLite database for zero-cost self-hosted deployment

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Type checking

# Docker Deployment
docker compose up -d          # Start container (builds if needed)
docker compose down           # Stop container
docker compose logs -f        # View logs

# Data Migration (from Supabase, if needed)
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/migrate-from-supabase.ts
```

## Architecture

### Data Flow
1. **Seeds** are stored in SQLite with planting timing info (weeks before/after frost, cold-hardy flags)
2. **User profile** stores ZIP code → looked up in `zip_frost_data` table → frost dates
3. **Calendar calculations** use frost dates + seed timing to compute planting windows (`src/lib/planting-window.ts`)

### Database Layer (SQLite + Drizzle ORM)
- **Schema**: Defined in `src/lib/db/schema.ts` using Drizzle ORM
- **Client**: `src/lib/db/index.ts` - database connection and initialization
- **Location**: SQLite file at `./data/seed-wizard.db` (or `DATABASE_PATH` env var)
- Current dev mode uses hardcoded user ID `00000000-0000-0000-0000-000000000000` (auth not yet implemented)

### AI Extraction Flow
1. User provides seed product URL
2. `src/lib/scraper/fetch-page.ts` fetches and cleans page content
3. `src/lib/claude/extract-seed-data.ts` sends to Claude with structured tool schema
4. Claude returns extracted data via `extract_seed_info` tool use
5. Data is validated and merged with defaults from `src/lib/plant-defaults/index.ts`

### API Routes
All in `src/app/api/`:
- `seeds/` - CRUD for seed inventory
- `seeds/[id]/` - Individual seed operations
- `extract/` - AI extraction endpoint
- `location/` - ZIP code → zone/frost date lookup
- `profile/` - User profile management

### Key Types
`src/types/database.ts` contains type definitions:
- `Seed`, `SeedInsert`, `SeedUpdate`
- `Profile`, `ProfileInsert`, `ProfileUpdate`
- `ZipFrostData`

## Database Schema

Three main tables (see `src/lib/db/schema.ts`):
- **profiles** - User settings (ZIP, zone, frost dates)
- **seeds** - Seed inventory with planting timing fields
- **zip_frost_data** - Static lookup table for ZIP → zone/frost dates

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_PATH` - Optional path to SQLite database (defaults to `./data/seed-wizard.db`)
- `ANTHROPIC_API_KEY` - For AI seed extraction

## Docker Deployment

The app is designed for self-hosted deployment via Docker:

```bash
# Build and run
docker compose up -d

# Access at http://localhost:3000
```

The SQLite database is persisted in a Docker volume (`seed-wizard-data`).

### Environment Variables for Docker
Set `ANTHROPIC_API_KEY` in your environment or a `.env` file before running:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
docker compose up -d
```

## AI Extraction Details

### Blocked Sites
Some seed company sites can't be scraped automatically (see `src/lib/scraper/blocked-sites.ts`):
- **Seed Savers Exchange** - JS-rendered storefront
- **Baker Creek (rareseeds.com)** - Bot protection (supports HTML paste workaround)
- **Southern Exposure** - SPA, content not in HTML

### Plant Defaults Database
`src/lib/plant-defaults/index.ts` contains fallback timing data for 70+ common vegetables, herbs, and flowers. When AI extraction misses timing info, the system looks up defaults by `common_name` with fuzzy matching.

## Planting Window Calculations

### Shared Library
`src/lib/planting-window.ts` contains the core planting date logic:
- `parseLocalDate(dateStr)` - Parse YYYY-MM-DD as local date (not UTC)
- `getPlantingDate(seed, lastFrost)` - Calculate planting date for a seed
- `getSeedsPlantableNow(seeds, lastFrostDate, windowWeeks)` - Filter seeds plantable within a time window

Both the dashboard widget and calendar page should use these shared functions for consistency.

### Estimated Frost Dates
When a ZIP code isn't in the database, `src/app/api/location/route.ts` estimates frost dates based on ZIP prefix regions. The `formatFrostDate()` helper ensures dates use the current/next year dynamically (not a hardcoded year).

## Current Development Status

Auth is not yet implemented - the app uses a hardcoded user ID (`00000000-0000-0000-0000-000000000000`). This is a personal-use application designed for local deployment.
