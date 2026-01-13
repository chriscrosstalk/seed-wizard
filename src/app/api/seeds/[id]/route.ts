import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Seed, SeedUpdate } from '@/types/database'

// Validation schema for updating seeds
const seedUpdateSchema = z.object({
  variety_name: z.string().min(1, 'Variety name is required').optional(),
  common_name: z.string().optional().nullable(),
  seed_company: z.string().optional().nullable(),
  product_url: z.string().url().optional().nullable().or(z.literal('')),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  purchase_year: z.number().int().min(1900).max(2100).optional().nullable(),
  quantity_packets: z.number().int().min(1).optional(),
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
  cold_hardy: z.boolean().optional(),
  weeks_before_last_frost_outdoor: z.number().int().min(0).optional().nullable(),
  succession_planting: z.boolean().optional(),
  succession_interval_days: z.number().int().min(1).optional().nullable(),
  fall_planting: z.boolean().optional(),
  cold_stratification_required: z.boolean().optional(),
  cold_stratification_weeks: z.number().int().min(1).optional().nullable(),
  is_favorite: z.boolean().optional(),
  is_planted: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/seeds/[id] - Get a single seed
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Seed)
}

// PUT /api/seeds/[id] - Update a seed
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate input
  const result = seedUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  // Build update data, only including fields that were explicitly provided
  // Clean empty strings to null for optional URL fields only if they were provided
  const updateData: SeedUpdate = { ...result.data }

  // Only modify URL fields if they were explicitly included in the request
  if ('product_url' in body) {
    updateData.product_url = result.data.product_url || null
  }
  if ('image_url' in body) {
    updateData.image_url = result.data.image_url || null
  }

  const { data, error } = await supabase
    .from('seeds')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Seed)
}

// DELETE /api/seeds/[id] - Delete a seed
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('seeds')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
