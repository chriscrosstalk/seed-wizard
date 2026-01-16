import Link from 'next/link'
import { Plus, Leaf, Sparkles } from 'lucide-react'
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
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--color-soil)] tracking-tight">
            My Seeds
          </h1>
          <p className="mt-2 text-[var(--color-bark)] flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[var(--color-sage-dark)]">
              <Leaf className="h-4 w-4" />
              {seedList.length}
            </span>
            <span>{seedList.length === 1 ? 'variety' : 'varieties'} in your collection</span>
          </p>
        </div>

        <Link
          href="/dashboard/inventory/add"
          className="
            group inline-flex items-center gap-2 rounded-xl
            bg-[var(--color-sage)] px-5 py-3
            text-sm font-semibold text-white
            shadow-md shadow-[var(--color-sage)]/20
            transition-all duration-200
            hover:bg-[var(--color-sage-dark)] hover:shadow-lg hover:shadow-[var(--color-sage)]/30
            hover:-translate-y-0.5
          "
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
          Add Seed
        </Link>
      </div>

      {seedList.length === 0 ? (
        /* Empty State */
        <div className="mt-16 rounded-2xl border-2 border-dashed border-[var(--color-parchment)] bg-[var(--color-warm-white)] p-12 text-center botanical-pattern">
          {/* Decorative illustration */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-[var(--color-sage-light)]/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-[var(--color-sage-light)]/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-12 w-12 text-[var(--color-sage)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21c-4.97 0-9-4.03-9-9 0-3.87 2.63-7.09 6.15-8.36C9.06 4.44 9 4.22 9 4c0-1.66 1.34-3 3-3s3 1.34 3 3c0 .22-.06.44-.15.64C18.37 5.91 21 9.13 21 13c0 4.97-4.03 9-9 9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21v-9M9 15l3-3 3 3"
                />
              </svg>
            </div>
          </div>

          <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-soil)]">
            Start your seed collection
          </h2>
          <p className="mt-3 text-[var(--color-bark)] max-w-md mx-auto">
            Add seeds to your inventory and we&apos;ll help you plan when to plant them
            based on your local frost dates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/inventory/add"
              className="
                group inline-flex items-center gap-2 rounded-xl
                bg-[var(--color-sage)] px-6 py-3
                text-base font-semibold text-white
                shadow-md shadow-[var(--color-sage)]/20
                transition-all duration-200
                hover:bg-[var(--color-sage-dark)] hover:shadow-lg
                hover:-translate-y-0.5
              "
            >
              <Plus className="h-5 w-5" />
              Add Your First Seed
            </Link>

            <span className="text-[var(--color-branch)]">or</span>

            <Link
              href="/dashboard/inventory/add?mode=url"
              className="
                group inline-flex items-center gap-2 rounded-xl
                border-2 border-[var(--color-terracotta-light)] bg-transparent px-6 py-3
                text-base font-semibold text-[var(--color-terracotta-dark)]
                transition-all duration-200
                hover:bg-[var(--color-terracotta-light)]/20 hover:border-[var(--color-terracotta)]
              "
            >
              <Sparkles className="h-5 w-5" />
              Import from URL
            </Link>
          </div>

          {/* Feature hints */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            <div className="rounded-lg bg-[var(--color-parchment)]/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-soil)] mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] text-xs">
                  1
                </span>
                Add seeds
              </div>
              <p className="text-xs text-[var(--color-branch)]">
                Import from seed company URLs or enter manually
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-parchment)]/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-soil)] mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] text-xs">
                  2
                </span>
                Set your location
              </div>
              <p className="text-xs text-[var(--color-branch)]">
                We&apos;ll look up your frost dates automatically
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-parchment)]/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-soil)] mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] text-xs">
                  3
                </span>
                Get your calendar
              </div>
              <p className="text-xs text-[var(--color-branch)]">
                See exactly when to start each seed
              </p>
            </div>
          </div>
        </div>
      ) : (
        <SeedList seeds={seedList} lastFrostDate={lastFrostDate} />
      )}
    </div>
  )
}
