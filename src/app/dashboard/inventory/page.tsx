import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SeedList } from '@/components/seeds/seed-list'
import type { Seed, Profile } from '@/types/database'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Fetch seeds and profile in parallel
  const [seedsResult, profileResult] = await Promise.all([
    supabase.from('seeds').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').single(),
  ])

  if (seedsResult.error) {
    console.error('Error fetching seeds:', seedsResult.error)
  }

  const seedList = (seedsResult.data as Seed[] | null) ?? []
  const profile = profileResult.data as Profile | null
  const lastFrostDate = profile?.last_frost_date ?? null

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Seeds</h1>
          <p className="mt-1 text-sm text-gray-500">
            {seedList.length} {seedList.length === 1 ? 'seed' : 'seeds'} in your collection
          </p>
        </div>
        <Link
          href="/dashboard/inventory/add"
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Add Seed
        </Link>
      </div>

      {seedList.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No seeds yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by adding your first seed to your inventory.
          </p>
          <Link
            href="/dashboard/inventory/add"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Your First Seed
          </Link>
        </div>
      ) : (
        <SeedList seeds={seedList} lastFrostDate={lastFrostDate} />
      )}
    </div>
  )
}
