# Seed Wizard - Project Overview

## Purpose
Seed Wizard is a web application that helps gardeners organize their seed inventory and generate personalized planting calendars based on their location.

## Target Users
- Home gardeners tracking seed purchases
- Eventually: multi-user SaaS for any gardener (Phase 4+)

## Core Features

### 1. Seed Inventory Management
- Add seed packages to inventory manually
- Track: variety name, seed company, purchase year, quantity, product URL
- Import seed data from product URLs using AI extraction
- View, edit, and delete seeds from inventory

### 2. AI-Powered Data Extraction
- User pastes a seed product URL (Johnny's Seeds, Baker Creek, Burpee, etc.)
- App fetches page content and sends to Claude API
- Claude extracts structured data: days to maturity, spacing, planting method, timing
- User reviews extracted data, can edit before saving

### 3. Location-Based Planting Calendar
- User enters ZIP code once in settings
- App looks up USDA hardiness zone and frost dates
- Calendar shows when to plant each seed based on:
  - Start indoors (X weeks before last frost)
  - Transplant outdoors (at last frost)
  - Direct sow (X weeks after last frost)
  - Cold-hardy direct sow (before last frost)
  - Succession plantings
  - Fall plantings
  - Cold stratification timing

### 4. User Accounts (Phase 4)
- Supabase Auth with Google/Microsoft/Facebook SSO
- Each user has isolated seed inventory
- User profile stores location/zone

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Single codebase, easy deployment, SSR |
| Language | TypeScript | Type safety, better DX |
| Database | Supabase (PostgreSQL) | Built-in auth, RLS, free tier |
| Auth | Supabase Auth | Google/Microsoft SSO, easy setup |
| AI | Claude API (Anthropic) | Structured extraction via tool use |
| Styling | Tailwind CSS | Utility-first, rapid development |
| Deployment | Vercel | Zero-config Next.js hosting |

## Project Structure

```
seed-wizard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing/dashboard
│   │   ├── (auth)/             # Auth routes
│   │   ├── dashboard/          # Protected app routes
│   │   │   ├── inventory/      # Seed list, add, edit
│   │   │   ├── calendar/       # Planting calendar
│   │   │   └── settings/       # User location settings
│   │   └── api/                # API routes
│   │       ├── seeds/          # CRUD operations
│   │       ├── extract/        # AI extraction endpoint
│   │       ├── location/       # Zone/frost lookup
│   │       └── calendar/       # Date calculations
│   ├── components/             # React components
│   ├── lib/                    # Utilities and clients
│   │   ├── supabase/           # DB clients
│   │   ├── claude/             # AI extraction
│   │   └── calendar/           # Date calculations
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL schema
│   └── seed.sql                # Initial data
└── specs/                      # This directory
```

## Development Phases

### Phase 1: Local MVP
- Next.js + Supabase setup
- Database schema
- Manual seed entry form
- Seed inventory list view
- ZIP code lookup with zone/frost dates
- Basic calendar (list view)

### Phase 2: AI Integration
- Claude API setup
- Page fetcher/cleaner
- Extraction prompt + tool schema
- "Import from URL" flow
- Test with multiple seed companies

### Phase 3: Enhanced Calendar
- Month/week calendar views
- Filter by event type, plant category
- Color coding by event type
- Print-friendly view

### Phase 4: Multi-User & Auth
- Supabase Auth (Google/Microsoft SSO)
- User profiles with location
- Row Level Security enforcement
- Vercel deployment

### Phase 5: Polish (Future)
- QR code scanning
- Planting log (track actual plantings)
- Mobile-responsive refinements
- CSV bulk import

## Success Criteria
1. User can add seeds to inventory manually
2. User can import seed data from a product URL via AI
3. User can set their ZIP code and see zone/frost dates
4. User can view a planting calendar with calculated dates
5. All data persists in Supabase
6. (Phase 4) Multiple users can have isolated inventories
