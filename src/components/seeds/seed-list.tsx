'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sprout,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  EyeOff,
  Leaf,
  Flower2,
  TreeDeciduous,
  X,
} from 'lucide-react'
import { SeedCard } from './seed-card'
import { findPlantDefault } from '@/lib/plant-defaults'
import { getSeedsPlantableNow, parseLocalDate } from '@/lib/planting-window'
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

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'alpha-asc', label: 'Name (A-Z)' },
  { value: 'alpha-desc', label: 'Name (Z-A)' },
  { value: 'planting-asc', label: 'Planting (earliest)' },
  { value: 'planting-desc', label: 'Planting (latest)' },
  { value: 'added-desc', label: 'Recently added' },
]

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

// Category pill component
function CategoryPill({
  category,
  label,
  icon: Icon,
  checked,
  onChange,
  count,
}: {
  category: CategoryFilter
  label: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
  onChange: () => void
  count: number
}) {
  const colorMap: Record<CategoryFilter, { bg: string; border: string; text: string; iconColor: string }> = {
    vegetable: {
      bg: 'bg-[var(--color-sky-soft)]/20',
      border: 'border-[var(--color-sky-soft)]',
      text: 'text-[var(--color-bark)]',
      iconColor: 'text-[var(--color-sky-muted)]',
    },
    flower: {
      bg: 'bg-[var(--color-rose-soft)]/20',
      border: 'border-[var(--color-rose-soft)]',
      text: 'text-[var(--color-bark)]',
      iconColor: 'text-[var(--color-rose-muted)]',
    },
    herb: {
      bg: 'bg-[var(--color-herb-light)]/40',
      border: 'border-[var(--color-herb-green)]/50',
      text: 'text-[var(--color-bark)]',
      iconColor: 'text-[var(--color-herb-green)]',
    },
  }

  const colors = colorMap[category]

  return (
    <button
      onClick={onChange}
      className={`
        group relative flex items-center gap-2 rounded-full px-4 py-2
        border transition-all duration-200
        ${checked
          ? `${colors.bg} ${colors.border} ${colors.text}`
          : 'bg-transparent border-[var(--color-parchment)] text-[var(--color-branch)] hover:border-[var(--color-branch)]'
        }
      `}
    >
      <Icon className={`h-4 w-4 ${checked ? colors.iconColor : 'text-[var(--color-branch)]'}`} />
      <span className="text-sm font-medium">{label}</span>
      <span className={`
        text-xs px-1.5 py-0.5 rounded-full
        ${checked ? 'bg-[var(--color-warm-white)]/60' : 'bg-[var(--color-parchment)]'}
      `}>
        {count}
      </span>
    </button>
  )
}

// Filter toggle button component
function FilterToggle({
  icon: Icon,
  label,
  checked,
  onChange,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  checked: boolean
  onChange: () => void
  variant?: 'default' | 'success' | 'warning'
}) {
  const variantStyles = {
    default: {
      active: 'bg-[var(--color-parchment)] border-[var(--color-branch)] text-[var(--color-soil)]',
      inactive: 'bg-transparent border-[var(--color-parchment)] text-[var(--color-branch)]',
    },
    success: {
      active: 'bg-[var(--color-sage-light)]/40 border-[var(--color-sage)] text-[var(--color-sage-dark)]',
      inactive: 'bg-transparent border-[var(--color-parchment)] text-[var(--color-branch)]',
    },
    warning: {
      active: 'bg-[var(--color-terracotta-light)]/30 border-[var(--color-terracotta)] text-[var(--color-terracotta-dark)]',
      inactive: 'bg-transparent border-[var(--color-parchment)] text-[var(--color-branch)]',
    },
  }

  const styles = variantStyles[variant]

  return (
    <button
      onClick={onChange}
      className={`
        flex items-center gap-2 rounded-full px-3 py-1.5 border
        text-sm font-medium transition-all duration-200
        hover:border-[var(--color-branch)]
        ${checked ? styles.active : styles.inactive}
      `}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export function SeedList({ seeds: initialSeeds, lastFrostDate }: SeedListProps) {
  const router = useRouter()
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc')
  const [mounted, setMounted] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [categoryFilters, setCategoryFilters] = useState<Record<CategoryFilter, boolean>>(defaultFilters)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [hidePlanted, setHidePlanted] = useState(false)
  const [plantableNow, setPlantableNow] = useState(false)

  // Update local seeds when props change
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

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    localStorage.setItem(SORT_STORAGE_KEY, newSort)
  }

  // Calculate which seeds are plantable now
  const plantableSeedIds = useMemo(() => {
    if (!lastFrostDate) return new Set<string>()
    const plantableResults = getSeedsPlantableNow(seeds, parseLocalDate(lastFrostDate), 4)
    return new Set(plantableResults.map(r => r.seed.id))
  }, [seeds, lastFrostDate])

  // Determine category for each seed
  const seedsWithCategory = useMemo(() => {
    return seeds.map(seed => {
      const plantDefault = seed.common_name ? findPlantDefault(seed.common_name) : undefined
      let category: CategoryFilter = 'vegetable'
      if (plantDefault?.category === 'herb') {
        category = 'herb'
      } else if (plantDefault?.category === 'flower') {
        category = 'flower'
      }
      return { seed, category }
    })
  }, [seeds])

  // Count seeds per category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = { vegetable: 0, flower: 0, herb: 0 }
    seedsWithCategory.forEach(({ category }) => {
      counts[category]++
    })
    return counts
  }, [seedsWithCategory])

  // Filter seeds
  const filteredSeeds = useMemo(() => {
    return seedsWithCategory.filter(({ seed, category }) => {
      if (!categoryFilters[category]) return false
      if (favoritesOnly && !seed.is_favorite) return false
      if (hidePlanted && seed.is_planted) return false
      if (plantableNow && !plantableSeedIds.has(seed.id)) return false
      return true
    })
  }, [seedsWithCategory, categoryFilters, favoritesOnly, hidePlanted, plantableNow, plantableSeedIds])

  // Sort seeds
  const sortedSeeds = useMemo(() => {
    const sorted = [...filteredSeeds]

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
      return 999
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

  const clearAllFilters = () => {
    setCategoryFilters(defaultFilters)
    setFavoritesOnly(false)
    setHidePlanted(false)
    setPlantableNow(false)
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(defaultFilters))
    localStorage.setItem(FAVORITES_ONLY_KEY, 'false')
    localStorage.setItem(HIDE_PLANTED_KEY, 'false')
    localStorage.setItem(PLANTABLE_NOW_KEY, 'false')
  }

  const hasActiveFilters = favoritesOnly || hidePlanted || plantableNow ||
    !categoryFilters.vegetable || !categoryFilters.flower || !categoryFilters.herb

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this seed?')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' })
      if (res.ok) {
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

  // Get the first seed for featured display (if exists and has image)
  const [featuredSeed, ...remainingSeeds] = sortedSeeds

  return (
    <div className="mt-8">
      {/* Filter Bar */}
      <div className="mb-6 rounded-xl bg-[var(--color-warm-white)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-parchment)]">
        {/* Top row: Sort + Filter toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Sort dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm font-medium text-[var(--color-bark)]">
              Sort by
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="
                  appearance-none rounded-lg border border-[var(--color-parchment)]
                  bg-[var(--color-cream)] px-4 py-2 pr-10 text-sm font-medium
                  text-[var(--color-soil)] shadow-[var(--shadow-soft)]
                  transition-all duration-200
                  hover:border-[var(--color-branch)]
                  focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-light)]
                "
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-branch)] pointer-events-none" />
            </div>
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 rounded-lg px-4 py-2
              text-sm font-medium transition-all duration-200
              ${showFilters || hasActiveFilters
                ? 'bg-[var(--color-sage-light)]/40 text-[var(--color-sage-dark)] border border-[var(--color-sage)]'
                : 'bg-[var(--color-cream)] text-[var(--color-bark)] border border-[var(--color-parchment)] hover:border-[var(--color-branch)]'
              }
            `}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-sage)] text-xs text-white">
                {[favoritesOnly, hidePlanted, plantableNow, !categoryFilters.vegetable, !categoryFilters.flower, !categoryFilters.herb].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filter section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[var(--color-parchment)] animate-fade-in">
            {/* Category filters */}
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--color-branch)] uppercase tracking-wide mb-3">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                <CategoryPill
                  category="vegetable"
                  label="Fruits & Vegetables"
                  icon={TreeDeciduous}
                  checked={categoryFilters.vegetable}
                  onChange={() => toggleCategory('vegetable')}
                  count={categoryCounts.vegetable}
                />
                <CategoryPill
                  category="flower"
                  label="Flowers"
                  icon={Flower2}
                  checked={categoryFilters.flower}
                  onChange={() => toggleCategory('flower')}
                  count={categoryCounts.flower}
                />
                <CategoryPill
                  category="herb"
                  label="Herbs"
                  icon={Leaf}
                  checked={categoryFilters.herb}
                  onChange={() => toggleCategory('herb')}
                  count={categoryCounts.herb}
                />
              </div>
            </div>

            {/* Additional filters */}
            <div>
              <p className="text-xs font-medium text-[var(--color-branch)] uppercase tracking-wide mb-3">
                Show
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterToggle
                  icon={Heart}
                  label="Favorites only"
                  checked={favoritesOnly}
                  onChange={toggleFavoritesOnly}
                  variant="warning"
                />
                <FilterToggle
                  icon={EyeOff}
                  label="Hide planted"
                  checked={hidePlanted}
                  onChange={toggleHidePlanted}
                />
                {lastFrostDate && (
                  <FilterToggle
                    icon={Sprout}
                    label="Plantable now"
                    checked={plantableNow}
                    onChange={togglePlantableNow}
                    variant="success"
                  />
                )}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 flex items-center gap-1 text-sm text-[var(--color-branch)] hover:text-[var(--color-terracotta)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-branch)]">
          Showing <span className="font-semibold text-[var(--color-soil)]">{sortedSeeds.length}</span> of{' '}
          <span className="font-semibold text-[var(--color-soil)]">{seeds.length}</span> seeds
        </p>
      </div>

      {/* Seed Grid */}
      {sortedSeeds.length > 0 ? (
        <div className="stagger-children">
          {/* Featured card (first item, spans 2 columns on larger screens) */}
          {featuredSeed && featuredSeed.seed.image_url && (
            <div className="mb-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <SeedCard
                  seed={featuredSeed.seed}
                  category={featuredSeed.category}
                  variant="featured"
                  onDelete={handleDelete}
                  onFavoriteChange={handleFavoriteChange}
                  onPlantedChange={handlePlantedChange}
                />
                {/* Show second card next to featured on large screens */}
                {remainingSeeds[0] && (
                  <div className="hidden lg:block">
                    <SeedCard
                      seed={remainingSeeds[0].seed}
                      category={remainingSeeds[0].category}
                      variant="featured"
                      onDelete={handleDelete}
                      onFavoriteChange={handleFavoriteChange}
                      onPlantedChange={handlePlantedChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* If no featured card, show all. Otherwise skip the ones shown above */}
            {(featuredSeed?.seed.image_url
              ? remainingSeeds.slice(1) // Skip the one shown next to featured on lg
              : sortedSeeds
            ).map(({ seed, category }, index) => (
              <SeedCard
                key={seed.id}
                seed={seed}
                category={category}
                onDelete={handleDelete}
                onFavoriteChange={handleFavoriteChange}
                onPlantedChange={handlePlantedChange}
              />
            ))}
            {/* Show the second card on mobile (it's hidden above on lg) */}
            {featuredSeed?.seed.image_url && remainingSeeds[0] && (
              <div className="lg:hidden">
                <SeedCard
                  seed={remainingSeeds[0].seed}
                  category={remainingSeeds[0].category}
                  onDelete={handleDelete}
                  onFavoriteChange={handleFavoriteChange}
                  onPlantedChange={handlePlantedChange}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state when all filtered out */
        <div className="rounded-xl border-2 border-dashed border-[var(--color-parchment)] bg-[var(--color-warm-white)]/50 py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-parchment)] flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-[var(--color-branch)]" />
          </div>
          <p className="text-[var(--color-bark)] font-medium">No seeds match your filters</p>
          <p className="text-sm text-[var(--color-branch)] mt-1">
            Try adjusting your filter settings
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-sage-dark)] transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
