'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout } from 'lucide-react'
import { SeedCard } from './seed-card'
import { findPlantDefault } from '@/lib/plant-defaults'
import { getSeedsPlantableNow } from '@/lib/planting-window'
import type { Seed } from '@/types/database'

interface SeedListProps {
  seeds: Seed[]
  lastFrostDate?: string | null
}

export type CategoryFilter = 'vegetable' | 'flower' | 'herb'

type SortOption = 'alpha-asc' | 'alpha-desc' | 'planting-asc' | 'planting-desc' | 'added-desc'

const SORT_STORAGE_KEY = 'seed-wizard-sort-preference'
const FILTER_STORAGE_KEY = 'seed-wizard-category-filters'
const FAVORITES_ONLY_KEY = 'seed-wizard-favorites-only'
const HIDE_PLANTED_KEY = 'seed-wizard-hide-planted'
const PLANTABLE_NOW_KEY = 'seed-wizard-plantable-now'

function getStoredSort(): SortOption {
  if (typeof window === 'undefined') return 'alpha-asc'
  const stored = localStorage.getItem(SORT_STORAGE_KEY)
  if (stored && ['alpha-asc', 'alpha-desc', 'planting-asc', 'planting-desc', 'added-desc'].includes(stored)) {
    return stored as SortOption
  }
  return 'alpha-asc'
}

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
  return stored === 'true'
}

export function SeedList({ seeds: initialSeeds, lastFrostDate }: SeedListProps) {
  const router = useRouter()
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc')
  const [mounted, setMounted] = useState(false)

  const [categoryFilters, setCategoryFilters] = useState<Record<CategoryFilter, boolean>>(defaultFilters)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [hidePlanted, setHidePlanted] = useState(false)
  const [plantableNow, setPlantableNow] = useState(false)

  // Update local seeds when props change (e.g., after navigation)
  useEffect(() => {
    setSeeds(initialSeeds)
  }, [initialSeeds])

  // Load stored preferences on mount
  useEffect(() => {
    setSortBy(getStoredSort())
    setCategoryFilters(getStoredFilters())
    setFavoritesOnly(getStoredBoolean(FAVORITES_ONLY_KEY))
    setHidePlanted(getStoredBoolean(HIDE_PLANTED_KEY))
    setPlantableNow(getStoredBoolean(PLANTABLE_NOW_KEY))
    setMounted(true)
  }, [])

  // Save sort preference when it changes
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    localStorage.setItem(SORT_STORAGE_KEY, newSort)
  }

  // Calculate which seeds are plantable now (if we have frost date)
  const plantableSeedIds = useMemo(() => {
    if (!lastFrostDate) return new Set<string>()
    const plantableResults = getSeedsPlantableNow(seeds, new Date(lastFrostDate), 4)
    return new Set(plantableResults.map(r => r.seed.id))
  }, [seeds, lastFrostDate])

  // Determine category for each seed based on common_name
  const seedsWithCategory = useMemo(() => {
    return seeds.map(seed => {
      const plantDefault = seed.common_name ? findPlantDefault(seed.common_name) : undefined
      // Map 'fruit' to 'vegetable' for filtering purposes, default uncategorized to 'vegetable'
      let category: CategoryFilter = 'vegetable'
      if (plantDefault?.category === 'herb') {
        category = 'herb'
      } else if (plantDefault?.category === 'flower') {
        category = 'flower'
      }
      return { seed, category }
    })
  }, [seeds])

  // Filter seeds based on selected categories and other filters
  const filteredSeeds = useMemo(() => {
    return seedsWithCategory.filter(({ seed, category }) => {
      // Category filter
      if (!categoryFilters[category]) return false
      // Favorites filter
      if (favoritesOnly && !seed.is_favorite) return false
      // Hide planted filter
      if (hidePlanted && seed.is_planted) return false
      // Plantable now filter
      if (plantableNow && !plantableSeedIds.has(seed.id)) return false
      return true
    })
  }, [seedsWithCategory, categoryFilters, favoritesOnly, hidePlanted, plantableNow, plantableSeedIds])

  // Sort seeds based on selected option
  const sortedSeeds = useMemo(() => {
    const sorted = [...filteredSeeds]

    // Helper to get planting week number (negative = before last frost, positive = after)
    const getPlantingWeek = (seed: Seed): number => {
      if (seed.planting_method === 'start_indoors' && seed.weeks_before_last_frost) {
        return -seed.weeks_before_last_frost
      }
      if (seed.planting_method === 'direct_sow') {
        if (seed.cold_hardy && seed.weeks_before_last_frost_outdoor) {
          return -seed.weeks_before_last_frost_outdoor
        }
        if (!seed.cold_hardy && seed.weeks_after_last_frost != null) {
          return seed.weeks_after_last_frost
        }
      }
      return 999 // Seeds without timing go to end
    }

    switch (sortBy) {
      case 'alpha-asc':
        sorted.sort((a, b) => a.seed.variety_name.localeCompare(b.seed.variety_name))
        break
      case 'alpha-desc':
        sorted.sort((a, b) => b.seed.variety_name.localeCompare(a.seed.variety_name))
        break
      case 'planting-asc':
        sorted.sort((a, b) => getPlantingWeek(a.seed) - getPlantingWeek(b.seed))
        break
      case 'planting-desc':
        sorted.sort((a, b) => getPlantingWeek(b.seed) - getPlantingWeek(a.seed))
        break
      case 'added-desc':
        sorted.sort((a, b) => new Date(b.seed.created_at).getTime() - new Date(a.seed.created_at).getTime())
        break
    }
    return sorted
  }, [filteredSeeds, sortBy])

  const toggleCategory = (category: CategoryFilter) => {
    setCategoryFilters(prev => {
      const updated = { ...prev, [category]: !prev[category] }
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const toggleFavoritesOnly = () => {
    setFavoritesOnly(prev => {
      const newValue = !prev
      localStorage.setItem(FAVORITES_ONLY_KEY, String(newValue))
      return newValue
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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this seed?')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' })
      if (res.ok) {
        // Remove from local state immediately
        setSeeds(prev => prev.filter(s => s.id !== id))
        router.refresh()
      } else {
        alert('Failed to delete seed')
      }
    } catch {
      alert('Failed to delete seed')
    } finally {
      setDeleting(null)
    }
  }

  function handleFavoriteChange(id: string, value: boolean) {
    setSeeds(prev => prev.map(s => s.id === id ? { ...s, is_favorite: value } : s))
  }

  function handlePlantedChange(id: string, value: boolean) {
    setSeeds(prev => prev.map(s => s.id === id ? { ...s, is_planted: value } : s))
  }

  return (
    <div className="mt-6">
      {/* Sort and Category Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="alpha-asc">Name (A-Z)</option>
            <option value="alpha-desc">Name (Z-A)</option>
            <option value="planting-asc">Planting Date (earliest)</option>
            <option value="planting-desc">Planting Date (latest)</option>
            <option value="added-desc">Recently Added</option>
          </select>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-gray-300" />

        {/* Category Filters */}
        <div className="flex items-center gap-3 sm:gap-4">
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

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-gray-300" />

        {/* Additional Filters */}
        <div className="flex items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-2 cursor-pointer rounded-full bg-yellow-50 px-3 py-1 border border-yellow-200">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={toggleFavoritesOnly}
              className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="text-sm font-medium text-yellow-800">Favorites only</span>
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
          {lastFrostDate && (
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
          )}
        </div>
      </div>

      {/* Seed Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSeeds.map(({ seed, category }) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            category={category}
            onDelete={handleDelete}
            onFavoriteChange={handleFavoriteChange}
            onPlantedChange={handlePlantedChange}
          />
        ))}
      </div>

      {/* Empty state when all filtered out */}
      {sortedSeeds.length === 0 && initialSeeds.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No seeds match the selected filters.
        </div>
      )}
    </div>
  )
}
