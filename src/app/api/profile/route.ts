import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase, getCurrentTimestamp } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Profile } from '@/types/database'

// Initialize database on first request
initializeDatabase()

const profileUpdateSchema = z.object({
  display_name: z.string().optional(),
  zip_code: z.string().max(10).optional(),
  hardiness_zone: z.string().max(5).optional(),
  last_frost_date: z.string().optional().nullable(),
  first_frost_date: z.string().optional().nullable(),
})

// GET /api/profile - Get current user's profile
export async function GET() {
  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  try {
    const [data] = await db.select().from(profiles).where(eq(profiles.id, userId))

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(data as Profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = profileUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  try {
    // Check if profile exists
    const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId))

    const now = getCurrentTimestamp()

    if (existing) {
      // Update existing profile
      await db
        .update(profiles)
        .set({
          ...result.data,
          updated_at: now,
        })
        .where(eq(profiles.id, userId))
    } else {
      // Create new profile
      await db.insert(profiles).values({
        id: userId,
        ...result.data,
        created_at: now,
        updated_at: now,
      })
    }

    // Fetch updated profile
    const [updated] = await db.select().from(profiles).where(eq(profiles.id, userId))

    return NextResponse.json(updated as Profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
