'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Sprout, Home, Sun, ArrowRight } from 'lucide-react'
import { getSeedsPlantableNow, type PlantableResult } from '@/lib/planting-window'
import { findPlantDefault } from '@/lib/plant-defaults'
import type { Seed, Profile } from '@/types/database'

interface PlantableNowWidgetProps {
  seeds: Seed[]
  profile: Profile
  maxItems?: number
}

const HIDE_PLANTED_KEY = 'seed-wizard-hide-planted'
const SHOW_INDOOR_KEY = 'seed-wizard-plantable-indoor'
const SHOW_OUTDOOR_KEY = 'seed-wizard-plantable-outdoor'

function getStoredBoolean(key: string, defaultValue: boolean = true): boolean {
  if (typeof window === 'undefined') return defaultValue
  const stored = localStorage.getItem(key)
  if (stored === null) return defaultValue
  return stored === 'true'
}

type CategoryFilter = 'vegetable' | 'flower' | 'herb'

function getCategory(seed: Seed): CategoryFilter {
  const plantDefault = seed.common_name ? findPlantDefault(seed.common_name) : undefined
  if (plantDefault?.category === 'herb') return 'herb'
  if (plantDefault?.category === 'flower') return 'flower'
  return 'vegetable'
}

const categoryStyles: Record<CategoryFilter, { border: string; bg: string; text: string }> = {
  vegetable: { border: 'border-l-sky-400', bg: 'bg-sky-50', text: 'text-sky-700' },
  flower: { border: 'border-l-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
  herb: { border: 'border-l-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

export function PlantableNowWidget({ seeds, profile, maxItems = 5 }: PlantableNowWidgetProps) {
  const [hidePlanted, setHidePlanted] = useState(false)
  const [showIndoor, setShowIndoor] = useState(true)
  const [showOutdoor, setShowOutdoor] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHidePlanted(getStoredBoolean(HIDE_PLANTED_KEY, false))
    setShowIndoor(getStoredBoolean(SHOW_INDOOR_KEY, true))
    setShowOutdoor(getStoredBoolean(SHOW_OUTDOOR_KEY, true))
    setMounted(true)
  }, [])

  const toggleHidePlanted = () => {
    setHidePlanted(prev => {
      const newValue = !prev
      localStorage.setItem(HIDE_PLANTED_KEY, String(newValue))
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

  const lastFrostDate = profile.last_frost_date ? new Date(profile.last_frost_date) : null

  const plantableSeeds = useMemo(() => {
    if (!lastFrostDate) return []

    let results = getSeedsPlantableNow(seeds, lastFrostDate, 4)

    // Apply filters
    results = results.filter(item => {
      if (hidePlanted && item.seed.is_planted) return false
      if (!showIndoor && item.eventType === 'indoor') return false
      if (!showOutdoor && item.eventType === 'outdoor') return false
      return true
    })

    return results.slice(0, maxItems)
  }, [seeds, lastFrostDate, hidePlanted, showIndoor, showOutdoor, maxItems])

  const totalPlantable = useMemo(() => {
    if (!lastFrostDate) return 0
    return getSeedsPlantableNow(seeds, lastFrostDate, 4).filter(item => {
      if (hidePlanted && item.seed.is_planted) return false
      if (!showIndoor && item.eventType === 'indoor') return false
      if (!showOutdoor && item.eventType === 'outdoor') return false
      return true
    }).length
  }, [seeds, lastFrostDate, hidePlanted, showIndoor, showOutdoor])

  if (!lastFrostDate) {
    return null
  }

  const formatDaysUntil = (days: number): string => {
    if (days < 0) {
      const pastDays = Math.abs(days)
      if (pastDays === 1) return '1 day ago'
      return `${pastDays} days ago`
    }
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days <= 7) return `In ${days} days`
    const weeks = Math.round(days / 7)
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-medium text-gray-900">
            <Sprout className="h-5 w-5 text-green-600" />
            What Can I Plant Now?
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
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
            <label className="flex items-center gap-2 cursor-pointer rounded-full bg-gray-100 px-3 py-1 border border-gray-200">
              <input
                type="checkbox"
                checked={hidePlanted}
                onChange={toggleHidePlanted}
                className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">Hide planted</span>
            </label>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {plantableSeeds.map(({ seed, plantingDate, eventType, daysUntilPlanting }) => {
          const category = getCategory(seed)
          const styles = categoryStyles[category]
          return (
            <div
              key={seed.id}
              className={`flex items-center justify-between px-6 py-3 border-l-4 ${styles.border} ${styles.bg}`}
            >
              <div className="flex items-center gap-3">
                {eventType === 'indoor' ? (
                  <Home className="h-4 w-4 text-purple-500" />
                ) : (
                  <Sun className="h-4 w-4 text-orange-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{seed.variety_name}</p>
                  <p className="text-sm text-gray-500">
                    {seed.common_name && `${seed.common_name} • `}
                    {eventType === 'indoor' ? 'Start indoors' : 'Direct sow'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${styles.text}`}>
                  {plantingDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500">{formatDaysUntil(daysUntilPlanting)}</p>
              </div>
            </div>
          )
        })}

        {plantableSeeds.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Sprout className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p>Nothing to plant right now.</p>
            <p className="mt-1 text-sm">
              Check back soon or adjust your filters above.
            </p>
          </div>
        )}
      </div>

      {totalPlantable > maxItems && (
        <div className="border-t border-gray-200 px-6 py-3">
          <Link
            href="/dashboard/calendar"
            className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
          >
            View all {totalPlantable} plantable seeds
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
