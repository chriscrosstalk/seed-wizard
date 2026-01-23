import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase, getCurrentTimestamp } from '@/lib/db'
import { seeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Seed } from '@/types/database'

// Initialize database on first request
initializeDatabase()

// Convert HTTP URLs to HTTPS for security
function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/^http:\/\//i, 'https://')
}

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

  try {
    const [data] = await db.select().from(seeds).where(eq(seeds.id, id))

    if (!data) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    const seed: Seed = {
      ...data,
      raw_ai_response: data.raw_ai_response ? JSON.parse(data.raw_ai_response) : null,
    }

    return NextResponse.json(seed)
  } catch (error) {
    console.error('Error fetching seed:', error)
    return NextResponse.json({ error: 'Failed to fetch seed' }, { status: 500 })
  }
}

// PUT /api/seeds/[id] - Update a seed
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    ...result.data,
    updated_at: getCurrentTimestamp(),
  }

  // Only modify URL fields if they were explicitly included in the request
  if ('product_url' in body) {
    updateData.product_url = result.data.product_url || null
  }
  if ('image_url' in body) {
    updateData.image_url = normalizeImageUrl(result.data.image_url)
  }

  try {
    // Check if seed exists
    const [existing] = await db.select().from(seeds).where(eq(seeds.id, id))
    if (!existing) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    // Perform update
    await db.update(seeds).set(updateData).where(eq(seeds.id, id))

    // Fetch updated seed
    const [updated] = await db.select().from(seeds).where(eq(seeds.id, id))

    const seed: Seed = {
      ...updated,
      raw_ai_response: updated.raw_ai_response ? JSON.parse(updated.raw_ai_response) : null,
    }

    return NextResponse.json(seed)
  } catch (error) {
    console.error('Error updating seed:', error)
    return NextResponse.json({ error: 'Failed to update seed' }, { status: 500 })
  }
}

// DELETE /api/seeds/[id] - Delete a seed
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Check if seed exists
    const [existing] = await db.select().from(seeds).where(eq(seeds.id, id))
    if (!existing) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 })
    }

    await db.delete(seeds).where(eq(seeds.id, id))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting seed:', error)
    return NextResponse.json({ error: 'Failed to delete seed' }, { status: 500 })
  }
}
