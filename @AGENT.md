# Seed Wizard - Agent Build Instructions

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **AI**: Claude API (Anthropic)

## Project Setup

```bash
# Create Next.js project (if not already created)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install date-fns zod lucide-react

# Install dev dependencies
npm install -D supabase
```

## Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (for AI extraction)
ANTHROPIC_API_KEY=sk-ant-api03-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running the Application

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Build Commands

```bash
# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check
# or
npx tsc --noEmit
```

## Supabase Commands

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/database.ts

# Run migrations
npx supabase db push

# Open Supabase Studio (local)
# http://localhost:54323
```

## Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format with Prettier (if configured)
npm run format
```

## Key File Locations

| Purpose | Location |
|---------|----------|
| Pages | `src/app/` |
| API Routes | `src/app/api/` |
| Components | `src/components/` |
| Supabase Client | `src/lib/supabase/` |
| Claude Integration | `src/lib/claude/` |
| Calendar Logic | `src/lib/calendar/` |
| Types | `src/types/` |
| Database Migrations | `supabase/migrations/` |

## Database Schema Location

See `specs/database.md` for full schema. Key tables:
- `profiles` - User settings (ZIP code, zone, frost dates)
- `seeds` - Seed inventory
- `zip_frost_data` - ZIP to zone/frost date lookup

## Common Development Tasks

### Adding a New Page
1. Create file in `src/app/dashboard/[page-name]/page.tsx`
2. Export default async function component
3. Add to navigation if needed

### Adding an API Route
1. Create file in `src/app/api/[route-name]/route.ts`
2. Export GET, POST, PUT, DELETE handlers as needed
3. Use `createClient()` from `src/lib/supabase/server.ts`

### Adding a Component
1. Create in `src/components/[category]/[component-name].tsx`
2. Use TypeScript interfaces for props
3. Export as named export

## Key Learnings
- Next.js App Router uses file-based routing in `src/app/`
- Supabase client differs between client and server components
- Use `'use client'` directive for interactive components
- API routes use Web Request/Response APIs
- Claude tool use requires specific schema format

## Feature Development Quality Standards

### Testing Requirements
- Minimum 85% code coverage for new code
- All tests must pass before marking complete
- Unit tests for business logic
- Integration tests for API routes

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Commit after each completed task
- Push regularly to maintain backup

### Documentation
- Update this file when adding new patterns
- Keep inline comments minimal but meaningful
- Update specs/ if requirements change

## Feature Completion Checklist

Before marking ANY feature complete:
- [ ] All tests pass
- [ ] Code coverage meets 85% threshold
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Changes committed with conventional commit message
- [ ] @fix_plan.md task marked complete
- [ ] Documentation updated if needed
