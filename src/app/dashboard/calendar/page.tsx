import Link from 'next/link'
import { MapPin, Sprout } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CalendarList } from '@/components/calendar/calendar-list'
import type { Profile, Seed } from '@/types/database'

export default async function CalendarPage() {
  const supabase = await createClient()

  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  // Get user's profile for frost dates
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  const profile = profileData as Profile | null

  // Get all seeds for calendar calculation
  const { data: seedsData } = await supabase
    .from('seeds')
    .select('*')
  const seeds = (seedsData as Seed[] | null) ?? []

  const hasLocation = profile?.last_frost_date && profile?.first_frost_date
  const seedCount = seeds.length

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
                {new Date(profile.last_frost_date!).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          <CalendarList seeds={seeds} lastFrostDate={profile.last_frost_date!} />
        </div>
      )}
    </div>
  )
}
