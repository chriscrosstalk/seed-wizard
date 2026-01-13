'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { findPlantDefault } from '@/lib/plant-defaults'
import type { Seed } from '@/types/database'

interface CalendarListProps {
  seeds: Seed[]
  lastFrostDate: string
}

type CategoryFilter = 'vegetable' | 'flower' | 'herb'

const FILTER_STORAGE_KEY = 'seed-wizard-category-filters'

const defaultFilters: Record<CategoryFilter, boolean> = {
  vegetable: true,
  flower: true,
  herb: true,
}

function getStoredFilters(): Record<CategoryFilter, boolean> {
  if (typeof window === 'undefined') return defaultFilters
  const stored = localStorage.getItem(FILTER_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return { ...defaultFilters, ...parsed }
    } catch {
      return defaultFilters
    }
  }
  return defaultFilters
}

const categoryStyles: Record<CategoryFilter, { border: string; bg: string; text: string }> = {
  vegetable: { border: 'border-l-sky-400', bg: 'bg-sky-50', text: 'text-sky-700' },
  flower: { border: 'border-l-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
  herb: { border: 'border-l-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

function getPlantingDate(seed: Seed, lastFrost: Date): { date: Date; eventType: string } | null {
  if (seed.planting_method === 'start_indoors') {
    if (seed.weeks_before_last_frost) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() - seed.weeks_before_last_frost * 7)
      return { date: plantDate, eventType: 'Start indoors' }
    }
  } else if (seed.planting_method === 'direct_sow') {
    if (seed.cold_hardy && seed.weeks_before_last_frost_outdoor) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() - seed.weeks_before_last_frost_outdoor * 7)
      return { date: plantDate, eventType: 'Direct sow (cold hardy)' }
    } else if (!seed.cold_hardy && seed.weeks_after_last_frost != null) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() + seed.weeks_after_last_frost * 7)
      return { date: plantDate, eventType: 'Direct sow' }
    }
  }
  return null
}

function getCategory(seed: Seed): CategoryFilter {
  const plantDefault = seed.common_name ? findPlantDefault(seed.common_name) : undefined
  if (plantDefault?.category === 'herb') return 'herb'
  if (plantDefault?.category === 'flower') return 'flower'
  return 'vegetable'
}

export function CalendarList({ seeds, lastFrostDate }: CalendarListProps) {
  const [categoryFilters, setCategoryFilters] = useState<Record<CategoryFilter, boolean>>(defaultFilters)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCategoryFilters(getStoredFilters())
    setMounted(true)
  }, [])

  const toggleCategory = (category: CategoryFilter) => {
    setCategoryFilters(prev => {
      const updated = { ...prev, [category]: !prev[category] }
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const lastFrost = new Date(lastFrostDate)

  // Calculate planting info, add category, filter, and sort by date
  const sortedSeeds = useMemo(() => {
    return seeds
      .map(seed => ({
        seed,
        planting: getPlantingDate(seed, lastFrost),
        category: getCategory(seed),
      }))
      .filter((item): item is { seed: Seed; planting: { date: Date; eventType: string }; category: CategoryFilter } =>
        item.planting !== null && categoryFilters[item.category]
      )
      .sort((a, b) => a.planting.date.getTime() - b.planting.date.getTime())
  }, [seeds, lastFrost, categoryFilters])

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-medium text-gray-900">
            <Calendar className="h-5 w-5 text-green-600" />
            Upcoming Planting Events
          </h2>

          {/* Category Filters */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-sky-100 px-3 py-1 border border-sky-200">
              <input
                type="checkbox"
                checked={categoryFilters.vegetable}
                onChange={() => toggleCategory('vegetable')}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm font-medium text-sky-800">Fruits/Vegetables</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-rose-100 px-3 py-1 border border-rose-200">
              <input
                type="checkbox"
                checked={categoryFilters.flower}
                onChange={() => toggleCategory('flower')}
                className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
              />
              <span className="text-sm font-medium text-rose-800">Flowers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-emerald-100 px-3 py-1 border border-emerald-200">
              <input
                type="checkbox"
                checked={categoryFilters.herb}
                onChange={() => toggleCategory('herb')}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-emerald-800">Herbs</span>
            </label>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedSeeds.map(({ seed, planting, category }) => {
          const styles = categoryStyles[category]
          return (
            <div
              key={seed.id}
              className={`flex items-center justify-between px-6 py-4 border-l-4 ${styles.border} ${styles.bg}`}
            >
              <div>
                <p className="font-medium text-gray-900">{seed.variety_name}</p>
                <p className="text-sm text-gray-500">
                  {seed.common_name && `${seed.common_name} • `}
                  {planting.eventType}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${styles.text}`}>
                  {planting.date.toLocaleDateString('en-US', {
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

        {sortedSeeds.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No planting dates available.</p>
            <p className="mt-1 text-sm">
              {seeds.length > 0
                ? 'Try selecting different categories above.'
                : 'Add planting method and timing info to your seeds to see calendar events.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
