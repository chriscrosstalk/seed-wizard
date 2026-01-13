# Seed Wizard - Fix Plan

## Phase 1: Project Setup & Core Infrastructure

### High Priority
- [ ] Initialize Next.js 14+ project with TypeScript and App Router
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project and install dependencies
- [ ] Create database schema migration (profiles, seeds, zip_frost_data tables)
- [ ] Set up Supabase client utilities (src/lib/supabase/client.ts, server.ts)
- [ ] Generate TypeScript types from database schema

### Medium Priority
- [ ] Create basic app layout (header, sidebar placeholder)
- [ ] Set up environment variables structure (.env.local, .env.example)
- [ ] Configure ESLint and Prettier

## Phase 2: Seed Inventory (Manual Entry)

### High Priority
- [ ] Create seed list page (src/app/dashboard/inventory/page.tsx)
- [ ] Create add seed form (src/app/dashboard/inventory/add/page.tsx)
- [ ] Implement seed CRUD API routes (src/app/api/seeds/route.ts)
- [ ] Create seed card component for list display
- [ ] Create seed form component with all fields

### Medium Priority
- [ ] Add seed detail/edit page (src/app/dashboard/inventory/[id]/page.tsx)
- [ ] Add delete confirmation dialog
- [ ] Add form validation with Zod

## Phase 3: Location & Frost Data

### High Priority
- [ ] Import ZIP code frost data into database (need to source data)
- [ ] Create location lookup API (src/app/api/location/route.ts)
- [ ] Create settings page for ZIP code entry (src/app/dashboard/settings/page.tsx)
- [ ] Store user's zone/frost dates in profile

### Medium Priority
- [ ] Add fallback to external API if ZIP not in database
- [ ] Display zone and frost dates on settings page

## Phase 4: Planting Calendar

### High Priority
- [ ] Create calendar calculation logic (src/lib/calendar/calculations.ts)
- [ ] Create calendar API endpoint (src/app/api/calendar/route.ts)
- [ ] Create calendar page with list view (src/app/dashboard/calendar/page.tsx)
- [ ] Display planting events grouped by month/week

### Medium Priority
- [ ] Add month view calendar component
- [ ] Add color coding by event type
- [ ] Add filters (by event type, by plant)
- [ ] Mark past events as completed

## Phase 5: AI Extraction

### High Priority
- [ ] Set up Anthropic SDK and client (src/lib/claude/client.ts)
- [ ] Create page fetcher utility (src/lib/scraper/fetch-page.ts)
- [ ] Create extraction prompts and tool schema (src/lib/claude/prompts.ts)
- [ ] Implement extraction function (src/lib/claude/extract-seed-data.ts)
- [ ] Create extraction API endpoint (src/app/api/extract/route.ts)

### Medium Priority
- [ ] Add "Import from URL" button to seed form
- [ ] Show extraction loading state
- [ ] Display extracted data for user review before saving
- [ ] Store raw AI response in seed record for debugging
- [ ] Test with multiple seed company formats

## Phase 6: Authentication (Future)

### Low Priority
- [ ] Configure Supabase Auth
- [ ] Add Google OAuth provider
- [ ] Add Microsoft OAuth provider
- [ ] Create login/signup pages
- [ ] Protect dashboard routes with middleware
- [ ] Create user profile on signup

## Phase 7: Polish & Deployment (Future)

### Low Priority
- [ ] Mobile-responsive refinements
- [ ] Print-friendly calendar view
- [ ] Add loading states and error handling throughout
- [ ] Deploy to Vercel
- [ ] Set up production Supabase project

## Completed
- [x] Project initialization (Ralph setup)
- [x] Create project specifications (specs/)

## Notes
- Focus on Phase 1-4 first (core functionality without AI)
- Phase 5 (AI) can be added once manual flow works
- Phase 6-7 are for multi-user production release
- Frost data sourcing may require web scraping or finding a dataset
- Test extraction with: Johnny's Seeds, Baker Creek, Burpee, Territorial
