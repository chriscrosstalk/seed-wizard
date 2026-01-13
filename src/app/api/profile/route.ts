import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  display_name: z.string().optional(),
  zip_code: z.string().max(10).optional(),
  hardiness_zone: z.string().max(5).optional(),
  last_frost_date: z.string().optional().nullable(),
  first_frost_date: z.string().optional().nullable(),
})

// GET /api/profile - Get current user's profile
export async function GET() {
  const supabase = await createClient()

  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profile)
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

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

  // Upsert profile (create if doesn't exist)
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...result.data,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profile)
}
