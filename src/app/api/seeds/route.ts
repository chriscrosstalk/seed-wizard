import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase, generateId, getCurrentTimestamp } from '@/lib/db'
import { seeds } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Seed, SeedInsert } from '@/types/database'
import { getDefaultTiming } from '@/lib/plant-defaults'

// Initialize database on first request
initializeDatabase()

// Convert HTTP URLs to HTTPS for security
function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/^http:\/\//i, 'https://')
}

// Validation schema for creating/updating seeds
const seedSchema = z.object({
  variety_name: z.string().min(1, 'Variety name is required'),
  common_name: z.string().optional().nullable(),
  seed_company: z.string().optional().nullable(),
  product_url: z.string().url().optional().nullable().or(z.literal('')),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  purchase_year: z.number().int().min(1900).max(2100).optional().nullable(),
  quantity_packets: z.number().int().min(1).default(1),
  notes: z.string().optional().nullable(),
  days_to_maturity_min: z.number().int().min(1).optional().nullable(),
  days_to_maturity_max: z.number().int().min(1).optional().nullable(),
  planting_depth_inches: z.number().min(0).optional().nullable(),
  spacing_inches: z.number().int().min(0).optional().nullable(),
  row_spacing_inches: z.number().int().min(0).optional().nullable(),
  sun_requirement: z.enum(['full_sun', 'partial_shade', 'shade']).optional().nullable(),
  water_requirement: z.enum(['low', 'medium', 'high']).optional().nullable(),
  planting_method: z.enum(['direct_sow', 'start_indoors']).optional().nullable(),
  weeks_before_last_frost: z.number().int().min(0).optional().nullable(),
  weeks_after_last_frost: z.number().int().min(0).optional().nullable(),
  cold_hardy: z.boolean().default(false),
  weeks_before_last_frost_outdoor: z.number().int().min(0).optional().nullable(),
  succession_planting: z.boolean().default(false),
  succession_interval_days: z.number().int().min(1).optional().nullable(),
  fall_planting: z.boolean().default(false),
  cold_stratification_required: z.boolean().default(false),
  cold_stratification_weeks: z.number().int().min(1).optional().nullable(),
})

// GET /api/seeds - List all seeds
export async function GET() {
  try {
    const data = await db.select().from(seeds).orderBy(desc(seeds.created_at))

    // Transform to match expected Seed type (booleans from integers, parse JSON)
    const seedList: Seed[] = data.map((row) => ({
      ...row,
      raw_ai_response: row.raw_ai_response ? JSON.parse(row.raw_ai_response) : null,
    }))

    return NextResponse.json(seedList)
  } catch (error) {
    console.error('Error fetching seeds:', error)
    return NextResponse.json({ error: 'Failed to fetch seeds' }, { status: 500 })
  }
}

// POST /api/seeds - Create a new seed
export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate input
  const result = seedSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  // Build seed data
  const seedData: SeedInsert = {
    ...result.data,
    product_url: result.data.product_url || null,
    image_url: normalizeImageUrl(result.data.image_url),
    // TODO: Replace with actual user ID from auth
    user_id: '00000000-0000-0000-0000-000000000000',
  }

  // Fill in missing timing info from plant defaults if available
  const hasTiming = seedData.weeks_before_last_frost != null ||
    seedData.weeks_after_last_frost != null ||
    seedData.weeks_before_last_frost_outdoor != null

  if (!hasTiming && seedData.common_name) {
    const defaults = getDefaultTiming(seedData.common_name)
    if (defaults) {
      seedData.planting_method = seedData.planting_method ?? defaults.planting_method ?? null
      seedData.cold_hardy = seedData.cold_hardy ?? defaults.cold_hardy ?? false
      seedData.weeks_before_last_frost = seedData.weeks_before_last_frost ?? defaults.weeks_before_last_frost ?? null
      seedData.weeks_after_last_frost = seedData.weeks_after_last_frost ?? defaults.weeks_after_last_frost ?? null
      seedData.weeks_before_last_frost_outdoor = seedData.weeks_before_last_frost_outdoor ?? defaults.weeks_before_last_frost_outdoor ?? null
    }
  }

  try {
    const id = generateId()
    const now = getCurrentTimestamp()

    await db.insert(seeds).values({
      id,
      user_id: seedData.user_id,
      variety_name: seedData.variety_name,
      common_name: seedData.common_name ?? null,
      seed_company: seedData.seed_company ?? null,
      product_url: seedData.product_url ?? null,
      image_url: seedData.image_url ?? null,
      purchase_year: seedData.purchase_year ?? null,
      quantity_packets: seedData.quantity_packets ?? 1,
      notes: seedData.notes ?? null,
      days_to_maturity_min: seedData.days_to_maturity_min ?? null,
      days_to_maturity_max: seedData.days_to_maturity_max ?? null,
      planting_depth_inches: seedData.planting_depth_inches ?? null,
      spacing_inches: seedData.spacing_inches ?? null,
      row_spacing_inches: seedData.row_spacing_inches ?? null,
      sun_requirement: seedData.sun_requirement ?? null,
      water_requirement: seedData.water_requirement ?? null,
      planting_method: seedData.planting_method ?? null,
      weeks_before_last_frost: seedData.weeks_before_last_frost ?? null,
      weeks_after_last_frost: seedData.weeks_after_last_frost ?? null,
      cold_hardy: seedData.cold_hardy ?? false,
      weeks_before_last_frost_outdoor: seedData.weeks_before_last_frost_outdoor ?? null,
      succession_planting: seedData.succession_planting ?? false,
      succession_interval_days: seedData.succession_interval_days ?? null,
      fall_planting: seedData.fall_planting ?? false,
      cold_stratification_required: seedData.cold_stratification_required ?? false,
      cold_stratification_weeks: seedData.cold_stratification_weeks ?? null,
      is_favorite: false,
      is_planted: false,
      ai_extracted: false,
      ai_extraction_date: null,
      raw_ai_response: null,
      created_at: now,
      updated_at: now,
    })

    // Fetch the created seed
    const [created] = await db.select().from(seeds).where(eq(seeds.id, id))

    const createdSeed: Seed = {
      ...created,
      raw_ai_response: created.raw_ai_response ? JSON.parse(created.raw_ai_response) : null,
    }

    return NextResponse.json(createdSeed, { status: 201 })
  } catch (error) {
    console.error('Error creating seed:', error)
    return NextResponse.json({ error: 'Failed to create seed' }, { status: 500 })
  }
}
