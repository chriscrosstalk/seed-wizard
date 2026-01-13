'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SeedCard } from './seed-card'
import { findPlantDefault } from '@/lib/plant-defaults'
import type { Seed } from '@/types/database'

interface SeedListProps {
  seeds: Seed[]
}

export type CategoryFilter = 'vegetable' | 'flower' | 'herb'

type SortOption = 'alpha-asc' | 'alpha-desc' | 'planting-asc' | 'planting-desc' | 'added-desc'

export function SeedList({ seeds }: SeedListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc')
  const [categoryFilters, setCategoryFilters] = useState<Record<CategoryFilter, boolean>>({
    vegetable: true,
    flower: true,
    herb: true,
  })

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

  // Filter seeds based on selected categories
  const filteredSeeds = useMemo(() => {
    return seedsWithCategory.filter(({ category }) => categoryFilters[category])
  }, [seedsWithCategory, categoryFilters])

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
    setCategoryFilters(prev => ({ ...prev, [category]: !prev[category] }))
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this seed?')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' })
      if (res.ok) {
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
            onChange={(e) => setSortBy(e.target.value as SortOption)}
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
      </div>

      {/* Seed Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSeeds.map(({ seed, category }) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            category={category}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Empty state when all filtered out */}
      {sortedSeeds.length === 0 && seeds.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No seeds match the selected categories.
        </div>
      )}
    </div>
  )
}
