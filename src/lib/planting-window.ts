import type { Seed } from '@/types/database'

export interface PlantableResult {
  seed: Seed
  plantingDate: Date
  eventType: 'indoor' | 'outdoor'
  daysUntilPlanting: number
}

/**
 * Calculate the planting date for a seed based on the last frost date.
 * Returns null if the seed doesn't have sufficient planting timing info.
 */
export function getPlantingDate(
  seed: Seed,
  lastFrost: Date
): { date: Date; eventType: 'indoor' | 'outdoor' } | null {
  if (seed.planting_method === 'start_indoors') {
    if (seed.weeks_before_last_frost) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() - seed.weeks_before_last_frost * 7)
      return { date: plantDate, eventType: 'indoor' }
    }
  } else if (seed.planting_method === 'direct_sow') {
    if (seed.cold_hardy && seed.weeks_before_last_frost_outdoor) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() - seed.weeks_before_last_frost_outdoor * 7)
      return { date: plantDate, eventType: 'outdoor' }
    } else if (!seed.cold_hardy && seed.weeks_after_last_frost != null) {
      const plantDate = new Date(lastFrost)
      plantDate.setDate(plantDate.getDate() + seed.weeks_after_last_frost * 7)
      return { date: plantDate, eventType: 'outdoor' }
    }
  }
  return null
}

/**
 * Get all seeds that are plantable within a given window from today.
 * The window starts from the seed's planting date and extends forward.
 *
 * @param seeds - Array of seeds to check
 * @param lastFrostDate - The user's last frost date
 * @param windowWeeks - Number of weeks the window extends (default: 4)
 * @returns Array of plantable seeds sorted by planting date
 */
export function getSeedsPlantableNow(
  seeds: Seed[],
  lastFrostDate: Date,
  windowWeeks: number = 4
): PlantableResult[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const windowEnd = new Date(today)
  windowEnd.setDate(windowEnd.getDate() + windowWeeks * 7)

  const results: PlantableResult[] = []

  for (const seed of seeds) {
    const planting = getPlantingDate(seed, lastFrostDate)
    if (!planting) continue

    const plantingDate = planting.date
    plantingDate.setHours(0, 0, 0, 0)

    // Check if planting date is within the window:
    // From the planting date to 4 weeks after (so if planting date was last week, still show it)
    const plantingWindowEnd = new Date(plantingDate)
    plantingWindowEnd.setDate(plantingWindowEnd.getDate() + windowWeeks * 7)

    // Show if: planting date hasn't passed by more than windowWeeks AND planting date is not too far in future
    if (plantingWindowEnd >= today && plantingDate <= windowEnd) {
      const daysUntilPlanting = Math.ceil(
        (plantingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      results.push({
        seed,
        plantingDate: planting.date,
        eventType: planting.eventType,
        daysUntilPlanting,
      })
    }
  }

  // Sort by planting date (earliest first)
  return results.sort((a, b) => a.plantingDate.getTime() - b.plantingDate.getTime())
}
