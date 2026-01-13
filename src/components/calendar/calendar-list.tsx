'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calendar, Sprout, Home, Sun } from 'lucide-react'
import { findPlantDefault } from '@/lib/plant-defaults'
import type { Seed } from '@/types/database'

interface CalendarListProps {
  seeds: Seed[]
  lastFrostDate: string
}

type CategoryFilter = 'vegetable' | 'flower' | 'herb'

const FILTER_STORAGE_KEY = 'seed-wizard-category-filters'
const HIDE_PLANTED_KEY = 'seed-wizard-hide-planted'
const PLANTABLE_NOW_KEY = 'seed-wizard-calendar-plantable-now'
const SHOW_INDOOR_KEY = 'seed-wizard-plantable-indoor'
const SHOW_OUTDOOR_KEY = 'seed-wizard-plantable-outdoor'

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

function getStoredBoolean(key: string, defaultValue: boolean = false): boolean {
  if (typeof window === 'undefined') return defaultValue
  const stored = localStorage.getItem(key)
  if (stored === null) return defaultValue
  return stored === 'true'
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
  const [hidePlanted, setHidePlanted] = useState(false)
  const [plantableNow, setPlantableNow] = useState(false)
  const [showIndoor, setShowIndoor] = useState(true)
  const [showOutdoor, setShowOutdoor] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCategoryFilters(getStoredFilters())
    setHidePlanted(getStoredBoolean(HIDE_PLANTED_KEY))
    setPlantableNow(getStoredBoolean(PLANTABLE_NOW_KEY))
    setShowIndoor(getStoredBoolean(SHOW_INDOOR_KEY, true))
    setShowOutdoor(getStoredBoolean(SHOW_OUTDOOR_KEY, true))
    setMounted(true)
  }, [])

  const toggleCategory = (category: CategoryFilter) => {
    setCategoryFilters(prev => {
      const updated = { ...prev, [category]: !prev[category] }
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const toggleHidePlanted = () => {
    setHidePlanted(prev => {
      const newValue = !prev
      localStorage.setItem(HIDE_PLANTED_KEY, String(newValue))
      return newValue
    })
  }

  const togglePlantableNow = () => {
    setPlantableNow(prev => {
      const newValue = !prev
      localStorage.setItem(PLANTABLE_NOW_KEY, String(newValue))
      return newValue
    })
  }

  const toggleShowIndoor = () => {
    setShowIndoor(prev => {
      const newValue = !prev
      localStorage.setItem(SHOW_INDOOR_KEY, String(newValue))
      return newValue
    })
  }

  const toggleShowOutdoor = () => {
    setShowOutdoor(prev => {
      const newValue = !prev
      localStorage.setItem(SHOW_OUTDOOR_KEY, String(newValue))
      return newValue
    })
  }

  const lastFrost = new Date(lastFrostDate)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate the 4-week window for "plantable now" filter
  const windowEnd = new Date(today)
  windowEnd.setDate(windowEnd.getDate() + 4 * 7)

  // Calculate planting info, add category, filter, and sort by date
  const sortedSeeds = useMemo(() => {
    return seeds
      .map(seed => ({
        seed,
        planting: getPlantingDate(seed, lastFrost),
        category: getCategory(seed),
      }))
      .filter((item): item is { seed: Seed; planting: { date: Date; eventType: string }; category: CategoryFilter } => {
        if (item.planting === null) return false
        if (!categoryFilters[item.category]) return false
        if (hidePlanted && item.seed.is_planted) return false

        // Plantable now filter: within 4-week window
        if (plantableNow) {
          const plantingDate = new Date(item.planting.date)
          plantingDate.setHours(0, 0, 0, 0)
          const plantingWindowEnd = new Date(plantingDate)
          plantingWindowEnd.setDate(plantingWindowEnd.getDate() + 4 * 7)
          // Only show if within window
          if (!(plantingWindowEnd >= today && plantingDate <= windowEnd)) return false

          // Indoor/outdoor filter (only applies when plantable now is enabled)
          const isIndoor = item.planting.eventType === 'Start indoors'
          if (isIndoor && !showIndoor) return false
          if (!isIndoor && !showOutdoor) return false
        }

        return true
      })
      .sort((a, b) => a.planting.date.getTime() - b.planting.date.getTime())
  }, [seeds, lastFrost, categoryFilters, hidePlanted, plantableNow, showIndoor, showOutdoor, today, windowEnd])

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-medium text-gray-900">
            <Calendar className="h-5 w-5 text-green-600" />
            Upcoming Planting Events
          </h2>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="hidden sm:block h-6 w-px bg-gray-300" />
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-gray-100 px-3 py-1 border border-gray-200">
              <input
                type="checkbox"
                checked={hidePlanted}
                onChange={toggleHidePlanted}
                className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">Hide planted</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-green-50 px-3 py-1 border border-green-200">
              <input
                type="checkbox"
                checked={plantableNow}
                onChange={togglePlantableNow}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <Sprout className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium text-green-800">Plantable now</span>
            </label>
            {plantableNow && (
              <>
                <label className="flex items-center gap-2 cursor-pointer rounded-full bg-purple-50 px-3 py-1 border border-purple-200">
                  <input
                    type="checkbox"
                    checked={showIndoor}
                    onChange={toggleShowIndoor}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Home className="h-3 w-3 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Indoor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer rounded-full bg-orange-50 px-3 py-1 border border-orange-200">
                  <input
                    type="checkbox"
                    checked={showOutdoor}
                    onChange={toggleShowOutdoor}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <Sun className="h-3 w-3 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Outdoor</span>
                </label>
              </>
            )}
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
