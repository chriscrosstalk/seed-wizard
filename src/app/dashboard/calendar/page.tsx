export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { MapPin, Sprout } from 'lucide-react'
import { db, initializeDatabase } from '@/lib/db'
import { profiles, seeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CalendarList } from '@/components/calendar/calendar-list'
import { parseLocalDate } from '@/lib/planting-window'
import type { Profile, Seed } from '@/types/database'

// Initialize database
initializeDatabase()

export default async function CalendarPage() {
  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  // Get user's profile for frost dates
  const [profileData] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
  const profile = profileData as Profile | undefined

  // Get all seeds for calendar calculation
  const seedsData = await db.select().from(seeds)
  const seedList: Seed[] = seedsData.map((row) => ({
    ...row,
    raw_ai_response: row.raw_ai_response ? JSON.parse(row.raw_ai_response) : null,
  }))

  const hasLocation = profile?.last_frost_date && profile?.first_frost_date
  const seedCount = seedList.length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Planting Calendar</h1>
      <p className="mt-2 text-gray-600">
        See when to start, transplant, and harvest your seeds.
      </p>

      {!hasLocation ? (
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <MapPin className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Set Your Location First</h3>
          <p className="mt-2 text-gray-600">
            To calculate planting dates, we need to know your frost dates.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            <MapPin className="h-4 w-4" />
            Set Location
          </Link>
        </div>
      ) : seedCount === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-center">
          <Sprout className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Seeds Yet</h3>
          <p className="mt-2 text-gray-600">
            Add seeds to your inventory to see your planting calendar.
          </p>
          <Link
            href="/dashboard/inventory/add"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Add Seeds
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <MapPin className="h-4 w-4" />
              <span>
                Zone {profile.hardiness_zone} | Last frost:{' '}
                {parseLocalDate(profile.last_frost_date!).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          <CalendarList seeds={seedList} lastFrostDate={profile.last_frost_date!} />
        </div>
      )}
    </div>
  )
}
