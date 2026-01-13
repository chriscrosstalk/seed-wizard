import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Seed, SeedInsert } from '@/types/database'
import { getDefaultTiming } from '@/lib/plant-defaults'

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Seed[])
}

// POST /api/seeds - Create a new seed
export async function POST(request: NextRequest) {
  const supabase = await createClient()

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

  // Clean empty strings to null for optional URL fields
  const seedData: SeedInsert = {
    ...result.data,
    product_url: result.data.product_url || null,
    image_url: result.data.image_url || null,
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
      // Only fill in if not already set
      seedData.planting_method = seedData.planting_method ?? defaults.planting_method ?? null
      seedData.cold_hardy = seedData.cold_hardy ?? defaults.cold_hardy ?? false
      seedData.weeks_before_last_frost = seedData.weeks_before_last_frost ?? defaults.weeks_before_last_frost ?? null
      seedData.weeks_after_last_frost = seedData.weeks_after_last_frost ?? defaults.weeks_after_last_frost ?? null
      seedData.weeks_before_last_frost_outdoor = seedData.weeks_before_last_frost_outdoor ?? defaults.weeks_before_last_frost_outdoor ?? null
    }
  }

  const { data, error } = await supabase
    .from('seeds')
    .insert(seedData as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Seed, { status: 201 })
}
