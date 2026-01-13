import Link from 'next/link'
import { Calendar, MapPin, Sprout } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()

  // TODO: Get actual user ID from auth
  const userId = '00000000-0000-0000-0000-000000000000'

  // Get user's profile for frost dates
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Get all seeds for calendar calculation
  const { data: seeds } = await supabase
    .from('seeds')
    .select('*')
    .order('variety_name')

  const hasLocation = profile?.last_frost_date && profile?.first_frost_date
  const seedCount = seeds?.length ?? 0

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

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="flex items-center gap-2 font-medium text-gray-900">
                <Calendar className="h-5 w-5 text-green-600" />
                Upcoming Planting Events
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {seeds?.filter(s => s.planting_method).map((seed) => {
                const lastFrost = new Date(profile.last_frost_date!)
                let plantDate: Date | null = null
                let eventType = ''

                if (seed.planting_method === 'start_indoors' || seed.planting_method === 'both') {
                  if (seed.weeks_before_last_frost) {
                    plantDate = new Date(lastFrost)
                    plantDate.setDate(plantDate.getDate() - seed.weeks_before_last_frost * 7)
                    eventType = 'Start indoors'
                  }
                } else if (seed.planting_method === 'direct_sow') {
                  if (seed.weeks_after_last_frost) {
                    plantDate = new Date(lastFrost)
                    plantDate.setDate(plantDate.getDate() + seed.weeks_after_last_frost * 7)
                    eventType = 'Direct sow'
                  } else if (seed.cold_hardy) {
                    plantDate = new Date(lastFrost)
                    plantDate.setDate(plantDate.getDate() - 14) // 2 weeks before last frost
                    eventType = 'Direct sow (cold hardy)'
                  }
                }

                if (!plantDate) return null

                return (
                  <div key={seed.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{seed.variety_name}</p>
                      <p className="text-sm text-gray-500">
                        {seed.common_name && `${seed.common_name} • `}
                        {eventType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {plantDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {seed.days_to_maturity_min && `${seed.days_to_maturity_min} days to harvest`}
                      </p>
                    </div>
                  </div>
                )
              })}

              {seeds?.filter(s => s.planting_method).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No planting dates available.</p>
                  <p className="mt-1 text-sm">
                    Add planting method and timing info to your seeds to see calendar events.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
