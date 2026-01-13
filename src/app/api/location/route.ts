import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ZipFrostData } from '@/types/database'

// GET /api/location?zip=12345 - Look up frost data for a ZIP code
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const zip = searchParams.get('zip')

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: 'Valid 5-digit ZIP code is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Try to find in our database first
  const { data, error } = await supabase
    .from('zip_frost_data')
    .select('*')
    .eq('zip_code', zip)
    .maybeSingle()

  if (error) {
    console.error('Database error:', error)
  }

  const frostData = data as ZipFrostData | null

  if (frostData) {
    return NextResponse.json({
      zip_code: frostData.zip_code,
      hardiness_zone: frostData.hardiness_zone,
      last_frost_date: frostData.last_frost_date_avg,
      first_frost_date: frostData.first_frost_date_avg,
      source: 'database',
    })
  }

  // Fallback: Use approximate data based on ZIP code prefix
  // This is a simplified estimation - real app would use external API
  const zipPrefix = parseInt(zip.substring(0, 3))
  const estimatedData = estimateFrostData(zipPrefix)

  return NextResponse.json({
    zip_code: zip,
    ...estimatedData,
    source: 'estimated',
    note: 'Frost dates are estimated. For accurate dates, check your local extension office.',
  })
}

// Simplified frost date estimation based on ZIP prefix regions
// This provides rough approximations for the continental US
function estimateFrostData(zipPrefix: number): {
  hardiness_zone: string
  last_frost_date: string
  first_frost_date: string
} {
  // Northeast (010-069, 100-149)
  if ((zipPrefix >= 10 && zipPrefix <= 69) || (zipPrefix >= 100 && zipPrefix <= 149)) {
    return {
      hardiness_zone: '6a',
      last_frost_date: '2000-05-01', // May 1
      first_frost_date: '2000-10-15', // Oct 15
    }
  }

  // Southeast (200-349)
  if (zipPrefix >= 200 && zipPrefix <= 349) {
    return {
      hardiness_zone: '7b',
      last_frost_date: '2000-04-01', // Apr 1
      first_frost_date: '2000-11-01', // Nov 1
    }
  }

  // Florida (320-349)
  if (zipPrefix >= 320 && zipPrefix <= 349) {
    return {
      hardiness_zone: '9a',
      last_frost_date: '2000-02-15', // Feb 15
      first_frost_date: '2000-12-15', // Dec 15
    }
  }

  // Midwest (400-499, 500-599, 600-629)
  if ((zipPrefix >= 400 && zipPrefix <= 499) || (zipPrefix >= 500 && zipPrefix <= 629)) {
    return {
      hardiness_zone: '5b',
      last_frost_date: '2000-05-10', // May 10
      first_frost_date: '2000-10-01', // Oct 1
    }
  }

  // South Central (700-799)
  if (zipPrefix >= 700 && zipPrefix <= 799) {
    return {
      hardiness_zone: '8a',
      last_frost_date: '2000-03-15', // Mar 15
      first_frost_date: '2000-11-15', // Nov 15
    }
  }

  // Mountain West (800-899)
  if (zipPrefix >= 800 && zipPrefix <= 899) {
    return {
      hardiness_zone: '5a',
      last_frost_date: '2000-05-15', // May 15
      first_frost_date: '2000-09-30', // Sep 30
    }
  }

  // Pacific Northwest (970-979, 980-994)
  if (zipPrefix >= 970 && zipPrefix <= 994) {
    return {
      hardiness_zone: '8b',
      last_frost_date: '2000-04-01', // Apr 1
      first_frost_date: '2000-11-01', // Nov 1
    }
  }

  // California (900-961)
  if (zipPrefix >= 900 && zipPrefix <= 961) {
    return {
      hardiness_zone: '9b',
      last_frost_date: '2000-02-01', // Feb 1
      first_frost_date: '2000-12-15', // Dec 15
    }
  }

  // Default fallback (Zone 6)
  return {
    hardiness_zone: '6a',
    last_frost_date: '2000-04-25', // Apr 25
    first_frost_date: '2000-10-20', // Oct 20
  }
}
