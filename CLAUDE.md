# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Seed Wizard is a Next.js 16 application that helps gardeners track seed inventory and generate personalized planting calendars based on their location (ZIP code → USDA zone → frost dates).

**Key Features:**
- Seed inventory management with manual entry and AI-powered URL extraction
- Planting calendar calculations based on user's frost dates
- Claude API integration for extracting seed data from product page URLs

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Type checking

# Supabase (requires Docker for local)
npx supabase start                                              # Start local Supabase
npx supabase gen types typescript --local > src/types/database.ts  # Regenerate types
npx supabase db push                                            # Run migrations
```

## Architecture

### Data Flow
1. **Seeds** are stored in Supabase with planting timing info (weeks before/after frost, cold-hardy flags)
2. **User profile** stores ZIP code → looked up in `zip_frost_data` table → frost dates
3. **Calendar calculations** use frost dates + seed timing to compute planting windows (`src/lib/planting-window.ts`)

### Supabase Client Pattern
- **Server components/API routes**: Use `createClient()` from `src/lib/supabase/server.ts`
- **Client components**: Use client from `src/lib/supabase/client.ts`
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
`src/types/database.ts` contains generated Supabase types plus convenience exports:
- `Seed`, `SeedInsert`, `SeedUpdate`
- `Profile`, `ProfileInsert`, `ProfileUpdate`
- `ZipFrostData`

## Database Schema

Three main tables (see `supabase/migrations/`):
- **profiles** - User settings (ZIP, zone, frost dates)
- **seeds** - Seed inventory with planting timing fields
- **zip_frost_data** - Static lookup table for ZIP → zone/frost dates

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection (project: `fqaueibvxvqsdazisdna`)
- `ANTHROPIC_API_KEY` - For AI seed extraction

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

Auth is not yet implemented - the app uses a hardcoded user ID (`00000000-0000-0000-0000-000000000000`). See `@fix_plan.md` for the full roadmap including auth (Phase 6) and deployment (Phase 7).
